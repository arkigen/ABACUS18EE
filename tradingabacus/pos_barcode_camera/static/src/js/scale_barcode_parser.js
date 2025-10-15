/** @odoo-module **/
import { patch } from "@web/core/utils/patch";
import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";

console.info("📦 v45: Parser de balanza activo");

patch(ProductScreen.prototype, {
    async _barcodeProductAction(code) {
        const rawCode = typeof code === 'string' ? code : (code.string || '');
        console.info("📥 Código escaneado:", rawCode);

        // Códigos de balanza
        if (rawCode.length === 13 && rawCode.startsWith("2")) {
            const plu = rawCode.slice(1, 6); // Ej: "06001"
            const price = parseInt(rawCode.slice(6, 11), 10); // Ej: 17100 → $17100 exactos
            console.info(`🔍 PLU extraído: ${plu}, Importe: $${price}`);

            const db = this.env.pos.db;
            const order = this.currentOrder;

            let product = db.get_product_by_barcode(plu) || db.get_product_by_reference(plu);

            if (!product) {
                const fallback = plu.replace(/^0+/, '');
                product = db.get_product_by_barcode(fallback) || db.get_product_by_reference(fallback);
            }

            if (product) {
                const options = await product.getAddProductOptions(code);
                Object.assign(options, {
                    price: price,
                    extras: { price_type: 'manual' },
                    merge: false,
                });
                order.add_product(product, options);
                this.numberBuffer.reset();
                return;
            } else {
                this.showPopup('ErrorPopup', {
                    title: this.env._t('Producto no encontrado'),
                    body: this.env._t(`No existe producto con código PLU ${plu}`),
                });
                this.numberBuffer.reset();
                return;
            }
        }

        // Procesamiento normal para otros códigos
        return super._barcodeProductAction(code);
    },
});
