/** @odoo-module **/
import { patch } from "@web/core/utils/patch";
import { barcodeReader } from "@point_of_sale/app/store/barcode_reader";

patch(barcodeReader, {
    async handleBarcode(code) {
        console.info("📦 Interceptado:", code);
        if (code.length === 13 && code.startsWith("2")) {
            const plu = code.slice(1, 6);  // Ej: "06001"
            const price = parseInt(code.slice(6, 11), 10); // Ej: 17100

            const db = this.pos.db;
            const order = this.pos.get_order();
            let product = db.get_product_by_barcode(plu) || db.get_product_by_reference(plu);

            if (!product) {
                const fallback = plu.replace(/^0+/, '');
                product = db.get_product_by_barcode(fallback) || db.get_product_by_reference(fallback);
            }

            if (product && order) {
                const options = await product.getAddProductOptions(code);
                Object.assign(options, {
                    price: price,
                    extras: { price_type: 'manual' },
                    merge: false,
                });
                order.add_product(product, options);
                console.log(`✅ Producto agregado desde código balanza: ${product.display_name}`);
                return;
            } else {
                this.pos.showPopup("ErrorPopup", {
                    title: "Producto no encontrado",
                    body: `No se encontró un producto para el código PLU ${plu}`,
                });
                return;
            }
        }

        return super.handleBarcode(...arguments);
    }
});
