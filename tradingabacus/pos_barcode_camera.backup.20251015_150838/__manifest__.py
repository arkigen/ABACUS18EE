# -*- coding: utf-8 -*-
{
    "name": "POS Barcode Camera + Parser confiable por ProductScreen (v45)",
    "version": "18.0.1.0.45",
    "summary": "Parche directo a ProductScreen con parser confiable para códigos de balanza",
    "author": "Avantiare GROUP SAS",
    "license": "LGPL-3",
    "category": "Point of Sale",
    "depends": ["point_of_sale"],
    "assets": {
        "point_of_sale._assets_pos": [
            "https://unpkg.com/@zxing/library@0.19.1/umd/index.min.js",
            "pos_barcode_camera/static/src/js/dom_camera_button.js",
            "pos_barcode_camera/static/src/js/scale_barcode_parser.js"
        ]
    },
    "installable": True,
    "application": False
}
