/** @odoo-module */

import { patch } from "@web/core/utils/patch";
import { BarcodeReader } from "@point_of_sale/app/barcode/barcode_reader_service";

// Patch BarcodeReader to handle weight products
patch(BarcodeReader.prototype, {
    async scan(code) {
        console.log("🔍 Barcode intercepted:", code);
        
        // Check if it's a weight product (EAN13 starting with 2) in Argentina
        if (code.length === 13 && code.startsWith('2') && this.isArgentinaPOS()) {
            console.log("⚖️ Processing weight product:", code);
            
            const result = await this.processWeightBarcode(code);
            if (result && result.success) {
                // More robust solution: Directly reset the NumberBuffer to clear its state.
                // This is the most reliable way to prevent price/quantity accumulation
                // on subsequent scans.
                const pos = this.pos || this.env?.services?.pos;
                if (pos && pos.env && pos.env.services && pos.env.services.number_buffer) {
                    console.log("⚫ Reseteando NumberBuffer para limpiar el estado.");
                    pos.env.services.number_buffer.reset();
                } else if (pos && pos.numpad) { // Fallback for older versions
                    console.log("⚫ Fallback: Reseteando numpad.");
                    pos.numpad.reset();
                }
                return; // Successfully processed, don't continue
            }
        }
        
        // Use original method for other barcodes
        return super.scan(code);
    },

    isArgentinaPOS() {
        // Try different ways to access POS
        const pos = this.pos || 
                   this.env?.services?.pos || 
                   window.posmodel || 
                   window.odoo?.pos;
                   
        if (!pos?.config?.company_id) {
            return false;
        }
        return pos.config.company_id[1]?.includes('(AR)') || 
               pos.company?.country?.code === 'AR' ||
               pos.config.company_country_code === 'AR';
    },

    async processWeightBarcode(code) {
        // Try different ways to access POS
        const pos = this.pos || 
                   this.env?.services?.pos || 
                   window.posmodel || 
                   window.odoo?.pos;
                   
        const db = pos?.db;
        const order = pos?.get_order();

        if (!db || !order) {
            this.showNotification("Terminal POS no disponible", 'danger');
            return { success: false, error: 'POS not available' };
        }

        try {
            const barcodeData = this._extractDataFromBarcode(code);
            if (!barcodeData.success) {
                this.showNotification(barcodeData.error, 'danger');
                return { success: false, error: barcodeData.error };
            }

            let { productCode, finalPrice } = barcodeData;
            
            let product = db.get_product_by_barcode(productCode);

            // Try with leading zero if not found
            if (!product) {
                productCode = '0' + productCode;
                product = db.get_product_by_barcode(productCode);
            }

            if (!product) {
                this.showNotification("Producto no encontrado en el sistema", 'warning');
                return { success: false, error: 'Product not found' };
            }

            const pricePerKg = product.lst_price;

            // Get product taxes
            const taxes = pos.get_taxes_after_fp(product.taxes_id);
            let taxAmount = 0;
            let priceBeforeTax = finalPrice;

            // Calculate base price by removing taxes
            if (taxes && taxes.length > 0) {
                const totalTaxRate = taxes.reduce((acc, tax) => {
                    if (tax.amount_type === 'percent') {
                        return acc + (tax.amount / 100);
                    }
                    return acc;
                }, 0);

                if (totalTaxRate > 0) {
                    priceBeforeTax = finalPrice / (1 + totalTaxRate);
                    taxAmount = finalPrice - priceBeforeTax;
                }
            }
            
            // Calculate weight based on price BEFORE tax
            let weight = priceBeforeTax / pricePerKg;
            weight = Number(weight.toFixed(3));

            if (weight <= 0 || isNaN(weight)) {
                throw new Error(`Peso inválido: ${weight}`);
            }
            
            const options = {
                quantity: weight,
                price: pricePerKg,
                extras: {
                    price_type: 'unit_price',
                    force_quantity: true
                }
            };

            order.add_product(product, options);
           
            this.beep(true);
            
            this.showNotification(
                `${product.display_name} - ${weight} kg x $${pricePerKg.toFixed(2)} = $${priceBeforeTax.toFixed(2)} + $${taxAmount.toFixed(2)} (tax)`, 
                'success'
            );

            return { 
                success: true, 
                product, 
                weight, 
                priceBeforeTax, 
                taxAmount, 
                finalPrice
            };

        } catch (error) {
            console.error("Weight barcode processing error:", error);
            this.beep(false);
            this.showNotification(`Error al procesar producto: ${error.message}`, 'danger');
            return { success: false, error: error.message };
        }
    },

    /**
     * Extracts product code and price from a weight-encoded EAN13 barcode.
     * Based on the successful pattern: 2[PLU 4][PRICE 7][CHECK 1]
     * The 7-digit price is composed of 5 digits for the integer part 
     * and 2 digits for the decimal part.
     * @param {string} code The 13-digit EAN barcode.
     * @returns {object} { success, productCode, finalPrice, error }
     */
    _extractDataFromBarcode(code) {
        if (!code || code.length !== 13 || !code.startsWith('2')) {
            return { success: false, error: "Código de barras no válido para productos de peso." };
        }
        
        // EAN13 Structure for Argentine Weight Products:
        // [0]    = Type (2)
        // [1-4]  = Product Code (4 digits)
        // [5-11] = Price (7 digits)
        // [12]   = Check Digit
        const productCode = code.substring(1, 5);
        const priceSection = code.substring(5, 12);
        
        const integerPart = priceSection.slice(0, 5);
        const decimalPart = priceSection.slice(5);
        
        const finalPrice = parseFloat(`${integerPart}.${decimalPart}`);

        if (isNaN(finalPrice) || finalPrice < 0) {
            return { success: false, error: `Precio extraído inválido: ${priceSection}` };
        }
        
        return {
            success: true,
            productCode: productCode,
            finalPrice: finalPrice
        };
    },

    beep(success = true) {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = success ? 880 : 220;
        oscillator.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.2);
    },

    showNotification(message, type = 'danger') {
        // Try different ways to access notification service
        const notification = this.env?.services?.notification || 
                           this.pos?.env?.services?.notification ||
                           window.odoo?.services?.notification;
        if (notification) {
            notification.add(message, { type: type });
        } else {
            console.warn('Notification service not available:', message);
            // Fallback to console
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
});