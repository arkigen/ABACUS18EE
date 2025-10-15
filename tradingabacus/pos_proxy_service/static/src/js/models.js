/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { PosStore } from "@point_of_sale/app/store/pos_store";
import { Order } from "@point_of_sale/app/store/models";
import { _t } from "@web/core/l10n/translation";
import { FiscalPrinterNotifier } from "./fiscal_printer_notifier";

// Load additional fields if they exist
const PARTNER_FIELDS = [];
const PAYMENT_FIELDS = ["payment_afip"];
const COMPANY_FIELDS = [];

try {
    // Try to load Argentinian specific fields
    const ar_fields = ["l10n_ar_afip_responsibility_type_id", "vat", "l10n_latam_identification_type_id"];
    PARTNER_FIELDS.push(...ar_fields);
    COMPANY_FIELDS.push("l10n_ar_afip_responsibility_type_id");
} catch (error) {
    console.warn("[Fiscal Printer] Campos AFIP no disponibles:", error);
}

patch(PosStore.prototype, {
    setup() {
        this.notifier = new FiscalPrinterNotifier();
        return super.setup(...arguments);
    },

    async after_load_server_data() {
        const result = await super.after_load_server_data();
        
        if (this.config && this.config.use_fiscal_printer) {
            try {
                const printerState = await this.state_printer().catch(() => null);
                if (!printerState) {
                    this.notifier.warning(_t("Falló la verificación del estado de la impresora fiscal. Por favor, verifique la conexión."));
                }
            } catch (error) {
                this.notifier.error(_t("Error al verificar el estado de la impresora: ") + error.message);
            }
        }
        
        return result;
    },

    async state_printer() {
        try {
            if (!this.config.proxy_fiscal_printer) {
                this.notifier.warning(_t("No hay URL de impresora fiscal configurada"));
                return null;
            }

            const baseUrl = this.config.proxy_fiscal_printer.replace(/\/+$/, '');
            const url = `${baseUrl}/state_printer`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 100000,
            }).catch(() => null);
            
            if (!response || !response.ok) {
                this.notifier.error(_t("La impresora fiscal no está en red"));
                return null;
            }
            
            const result = await response.json().catch(error => {
                this.notifier.error(_t("Error al procesar respuesta JSON: ") + error.message);
                return null;
            });

            if (result && result.response) {
                if (result.response === true) {
                    this.notifier.success(_t("Impresora lista"));
                } else {
                    this.notifier.info(_t("Estado de la impresora: ") + result.response);
                }
            }
            
            return result;
        } catch (error) {
            this.notifier.error(_t("Error al verificar el estado de la impresora: ") + error.message);
            return null;
        }
    },

    async print_pos_fiscal_close(type) {
        try {
            const baseUrl = this.config.proxy_fiscal_printer.replace(/\/+$/, '');
            const url = `${baseUrl}/print_pos_fiscal_close?type=${type}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 100000,
            });
            
            if (!response.ok) {
                this.notifier.error(_t("Error al imprimir cierre fiscal: Error de red"));
                return null;
            }
            
            const result = await response.json();
            
            if (result.response === true) {
                const type = this.get_value_type();
                if (type === 113) {
                    this.notifier.success(_t("Tique Nota de Crédito B impreso exitosamente"));
                } else if (type === 82) {
                    this.notifier.success(_t("Tique Factura B impreso exitosamente"));
                } else {
                    this.notifier.success(_t("Cierre fiscal impreso exitosamente"));
                }
            } else {
                this.notifier.warning(_t("Estado del cierre fiscal: ") + result.response);
            }
            
            return result;
        } catch (error) {
            this.notifier.error(_t("Error al imprimir cierre fiscal por conexión en red con la impresora fiscal"));
            return null;
        }
    },

    async print_pos_ticket() {
        try {
            const baseUrl = this.config.proxy_fiscal_printer.replace(/\/+$/, '');
            const url = `${baseUrl}/print_pos_ticket`;
            const values = this.get_values_ticket();
            const data = JSON.stringify(values);
            
            const response = await fetch(`${url}?vals=${encodeURIComponent(data)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 100000,
            });
            
            if (!response.ok) {
                this.notifier.error(_t("Error al imprimir ticket físcal: Error de red"));
                return null;
            }
            
            const result = await response.json();
            
            if (result.response === true) {
                const type = this.get_value_type();
                if (type === 113) {
                    this.notifier.success(_t("Tique Nota de Crédito B impreso exitosamente"));
                } else if (type === 82) {
                    this.notifier.success(_t("Tique Factura B impreso exitosamente"));
                } else {
                this.notifier.success(_t("Ticket impreso exitosamente"));
                }
            } else {
                this.notifier.warning(_t("Estado de impresión del ticket: ") + result.response);
            }
            
            return result;
        } catch (error) {
            this.notifier.error(_t("Error al imprimir ticket por conexión en red con la impresora fiscal"));
            return null;
        }
    },

    get_values_ticket() {
        const order = this.get_order();
        const type = this.get_value_type();
        const name = order.name;
        const cliente = this.get_values_client();
        const items = this.get_values_items();
        const pagos = this.get_values_paymentlines();
        const descuentos = this.get_values_discount();
        
        const jsonTemplate = {
            'name': name,
            'type': type,
            'cliente': cliente,
            'items': items,
            'pagos': pagos,
            'descuentos': descuentos,
            'ajustes': []
        };
        
        return jsonTemplate;
    },

    get_value_type() {
        const order = this.get_order();
        if (!order) return 83;
        
        const client = order.partner;
        // Calculate orderTotal once, early on.
        const orderTotal = this.get_order().get_total_with_tax();
        let type = 83; // Default type, will be overridden by conditions below.
        
        try {
            // New condition: if no client, determine type based on orderTotal.
            if (!client) {
                type = orderTotal < 0 ? 110 : 83;
            } 
            // Existing conditions for when a client IS present.
            else if (client.l10n_ar_afip_responsibility_type_id) { // Check if client has AFIP resp type first
                let company_type_afip_monotributo = false;
                if (this.company.l10n_ar_afip_responsibility_type_id && 
                    this.company.l10n_ar_afip_responsibility_type_id[1] === 'Responsable Monotributo') {
                    company_type_afip_monotributo = true;
                }
                
                if (!company_type_afip_monotributo) { // Proceed if company is not Monotributo
                    const respType = client.l10n_ar_afip_responsibility_type_id[1];
                    if (respType === 'IVA Responsable Inscripto') {
                        // For 'IVA Responsable Inscripto', determine type based on orderTotal
                        type = orderTotal < 0 ? 112 : 81; // NC A (112) or Tique Factura A (81)
                    } else if (respType === 'Responsable Monotributo') {
                        // For 'Responsable Monotributo', determine type based on orderTotal
                        type = orderTotal < 0 ? 114 : 111; // NC C (114) or Tique Factura C (111)
                    } else if (respType === 'Consumidor Final' || respType === 'IVA Sujeto Exento') {
                        // orderTotal is already defined above
                        type = orderTotal < 0 ? 113 : 82; // NC B (113) or Tique Factura B (82)
                    }
                    // Add other specific client respType conditions here if needed
                } else { // Company IS Monotributo
                    // For company 'Responsable Monotributo', all documents are C type
                    type = orderTotal < 0 ? 114 : 111; // NC C (114) or Tique Factura C (111)
                }
            } else if (this.company.l10n_ar_afip_responsibility_type_id && this.company.l10n_ar_afip_responsibility_type_id[1] === 'Responsable Monotributo') {
                // Client has no specific AFIP resp type, but company is Monotributo
                type = orderTotal < 0 ? 114 : 111; // NC C (114) or Tique Factura C (111)
            }
            // If client has no l10n_ar_afip_responsibility_type_id and company is not Monotributo,
            // and we didn't hit the '!client' case, it will retain the default 'type = 83' or the last set type.
            // This path implies a client object exists but lacks specific AFIP details,
            // or company is not Monotributo.
            // For such generic client cases, if it's a refund, it should be 110.
            // This can be ensured if the previous conditions didn't set a more specific refund type.
            // The `if (!client)` already covers the primary no-client scenario.
            // Let's refine the fallback for when client exists but doesn't match specific fiscal types.
            else { // Client exists but doesn't match specific AFIP types above & company isn't Monotributo setting C by default
                 // Default to B type documents if client exists but doesn't fit other categories explicitly.
                 // For refunds, it would be NC B.
                type = orderTotal < 0 ? 113 : 82;
            }

        } catch (error) {
            console.warn("[Fiscal Printer] Error getting value type:", error);
        }
        
        return type;
    },

    get_values_client() {
        const order = this.get_order();
        const client = order ? order.partner : null;
        
        if (!client) return null;
        
        try {
            let id_responsabilidad_iva = 'E';
            if (client.l10n_ar_afip_responsibility_type_id) {
                const respType = client.l10n_ar_afip_responsibility_type_id[1];
                if (respType === 'IVA Responsable Inscripto') {
                    id_responsabilidad_iva = 'I';
                } else if (respType === 'Responsable Monotributo') {
                    id_responsabilidad_iva = 'M';
                } else if (respType === 'Consumidor Final') {
                    id_responsabilidad_iva = 'F';
                } else if (respType === 'IVA Sujeto Exento') {
                    id_responsabilidad_iva = 'E';
                }
            }
            
            let id_tipo_documento = 'T';
            if (client.l10n_latam_identification_type_id) {
                const idType = client.l10n_latam_identification_type_id[1];
                if (idType === 'CUIT') id_tipo_documento = 'T';
                else if (idType === 'DNI') id_tipo_documento = 'D';
                else if (idType === 'CUIL') id_tipo_documento = 'L';
                else if (idType === 'Pasaporte') id_tipo_documento = 'P';
            }

            // Clean document number to keep only alphanumeric characters
            const document_number = client.vat ? client.vat.replace(/[^a-zA-Z0-9]/g, '') : '';
            
            return {
                nombre_o_razon_social1: client.name || '',
                nombre_o_razon_social2: '',
                domicilio1: client.country_id ? client.country_id[1] : '',
                domicilio2: client.city || '',
                domicilio3: client.street || '',
                id_responsabilidad_iva,
                id_tipo_documento,
                numero_documento: document_number,
                documento_asociado1: '',
                documento_asociado2: '',
                documento_asociado3: '',
                cheque_reintegro_turista: ''
            };
        } catch (error) {
            console.warn("[Fiscal Printer] Error getting client values:", error);
            return null;
        }
    },

    get_values_items() {
        const order_lines = this.get_order().get_orderlines();
        const items = [];
        const type = this.get_value_type();
        
        for (let i = 0; i < order_lines.length; i++) {
            const line = order_lines[i];
            const taxes = line.get_taxes();
            let iva = 0;
            let code_intern = '';
            let unit_measure = 0;
            
            for (let k = 0; k < taxes.length; k++) {
                if (taxes[k]) {
                    iva = taxes[k].amount;
                    break;
                }
            }

            const uom = line.get_unit();
            if (uom) {
                unit_measure = parseInt(uom.afip_uom);
            }
            
            if (line.product.barcode) {
                code_intern = line.product.barcode;
            } else if (line.product.default_code) {
                code_intern = line.product.default_code;
            }

            if (code_intern === '') {
                code_intern = '11111';
            }
            
            let price = line.get_unit_price() * (1.0 - (line.get_discount() / 100.0));
            if (this.config.version_printer === 'hasar250') {
                price = line.get_all_prices().priceWithTax;
            } else if (this.config.version_printer === 'epsont900fa' && type === 83) {
                price = line.get_all_prices().priceWithTax / line.quantity;               
            } else if (this.config.version_printer === 'epsont900fa' && type !== 83) {
                price = line.get_all_prices().priceWithoutTax / line.quantity;
            }

            if (type === 113 || type === 110) {
                price = Math.abs(price);
            }

            let product_discount_general = false;
            
            if ('module_pos_discount' in this.config && this.config.module_pos_discount) {
                if (this.config.discount_product_id && 
                    this.config.discount_product_id[0] === line.product.id && 
                    price < 0) {
                    product_discount_general = true;
                }
            }
            
            const item_vals = {
                'description': line.product.display_name,
                'description_extra1': '',
                'qty': Math.abs(line.quantity),
                'price': Math.abs(price),
                'iva': iva,
                'unit_measure': String(unit_measure),
                'code_intern': code_intern,
                'product_discount_general': product_discount_general
            };
            
            items.push(item_vals);
        }
        
        return items;
    },
    
    get_values_paymentlines() {
        const paymentlines = this.get_order().get_paymentlines();
        const pagos = [];
        
        for (let i = 0; i < paymentlines.length; i++) {
            const pay = paymentlines[i];
            let payment_afip = 99;

            if (pay.payment_method && pay.payment_method.payment_afip) {
                payment_afip = pay.payment_method.payment_afip;
            }
            
            const payment_method = pay.payment_method;
            let name = '';
            
            if (payment_method) {
                name = payment_method.name;
            }

            const pay_vals = {
                'codigo_forma_pago': payment_afip,
                'cantidad_cuotas': '',
                'monto': Math.abs(pay.amount),
                'descripcion_cupones': '',
                'descripcion': name,
                'descripcion_extra1': '',
                'descripcion_extra2': ''
            };
            
            pagos.push(pay_vals);
        }
        
        return pagos;
    },
    
    get_values_discount() {
        const order_lines = this.get_order().get_orderlines();
        const rounding = this.currency.rounding;
        let sum_amount_discount = 0;

        for (let i = 0; i < order_lines.length; i++) {
            const line = order_lines[i];
            const base_price = line.get_base_price();
            const price_line_bruto = Number((line.get_unit_price() * line.get_quantity()).toFixed(2));
            const discount = price_line_bruto - base_price;
            sum_amount_discount += discount;
        }
        
        if (sum_amount_discount === 0) {
            return [];
        }
        
        const vals = [
            {
                'descripcion': 'Descuentos', 
                'monto': Math.abs(Number(sum_amount_discount.toFixed(2))), 
                'tasa_iva': '', 
                'codigo_interno': '', 
                'codigo_condicion_iva': ''
            }
        ];
        
        return vals;
    },

    message_error_printer_fiscal(message) {
        if (message !== true) {
            this.notifier.error(message);
        }
    },

    async add_new_order() {
        const newOrder = await super.add_new_order(...arguments);
        if (newOrder) {
            console.log("[POS_PROXY_SERVICE] New order added by PosStore.add_new_order. Current partner before clearing:", newOrder.get_partner()?.name);
            newOrder.set_partner(null);
            console.log("[POS_PROXY_SERVICE] Partner explicitly set to null for new order by PosStore patch.");
        }
        return newOrder;
    }
});

patch(Order.prototype, {
    setup(options) {
        // We call super.setup first to let the core Order initialize, including potentially a default partner
        super.setup(...arguments);
        
        // This logic attempts to clear the partner if it's a truly new order context
        // and no partner was explicitly intended by the options passed to setup.
        // The main clearing is intended to be handled by PosStore.add_new_order patch.
        // This is a more defensive measure.
        const isTrulyNewOrder = this.orderlines.length === 0 && this.paymentlines.length === 0 && !this.name;
        const partnerWasIntendedInOptions = options && options.partner;

        if (isTrulyNewOrder && !partnerWasIntendedInOptions) {
            const currentPartner = this.get_partner();
            if (currentPartner) {
                console.log("[POS_PROXY_SERVICE] Order setup: Order appears new and no partner intended in options. Found lingering partner:", currentPartner.name, ". Setting to null.");
                this.set_partner(null);
            }
        } else if (partnerWasIntendedInOptions) {
            console.log("[POS_PROXY_SERVICE] Order setup: Partner was intended in options or order is not new. Partner:", this.get_partner()?.name);
        } else if (!isTrulyNewOrder) {
            console.log("[POS_PROXY_SERVICE] Order setup: Order is not new. Partner:", this.get_partner()?.name);
        }
    }
});