# -*- coding: utf-8 -*-
# Copyright (C) Softhealer Technologies.
{
    "name": "Point Of Sale Manager Validation",
    "author": "Softhealer Technologies",
    "website": "https://www.softhealer.com",
    "support": "support@softhealer.com",
    "category": "point of sale",
    "license": "OPL-1",
    
    "summary": "POS Validate Authenticate POS Manager Add/remove Quantity POS Change Price POS Remove Order Line POS Remove Order POS Close POS Screen POS Validation POS Order Validate POS Manager Approval POS Order Validation Order Deletion Order Line Deletion Discount Application Order Payment Price Change Decreasing Quantity Odoo POS Validation Odoo POS Validate Odoo POS Confirmation Odoo POS Confirm Odoo POS Checking Odoo POS Check Odoo POS Access Odoo POS User Access Right Delete Order Delete Order line POS Closing Decrease Quantity POS Cash In/Out POS Cash Out/In POS Cash Movement  POS Order Deletion POS Order Line Deletion POS Order Discount Application POS Order Payment POS Order Price Change POS Order Decreasing Quantity Odoo POS Validation Type Odoo POS Validate by Password POS Validate by Barcode Odoo Point Of Sale Confirmation Odoo Point Of Sale Confirm Odoo Point Of Sale Checking Odoo Point Of Sale Check Odoo Point Of Sale Access Odoo Point Of Sale User Access Right POS Delete Order POS Order Delete Order line Point Of Sale Closing POS Order Decrease Quantity Cash In/Out Cash Out/In Cash Movement POS Order Refund Cash In Cash Out POS Order Cash In POS Order Cash Out Point of Sale Order Deletion Point of Sale Order Line Deletion Point of Sale Order Discount Application Point of Sale Order Payment Point of Sale Order Price Change Point of Sale Order Decreasing Quantity Odoo Point of Sale Validation Type Odoo Point of Sale Validate by Password Point of Sale Validate by Barcode Odoo Sale Confirmation Odoo Sale Confirm Odoo Sale Checking Odoo Sale Check Odoo Sale Access Odoo Sale User Access Right Point of Sale Delete Order Point of Sale Order Delete Order line Sale Closing Point of Sale Order Decrease Quantity Cash In/Out Point of Sale Cash Out/In Point of Sale Cash Movement Point of Sale Order Refund Point of Sale Cash In Point of Sale Cash Out Point of Sale Order Cash In Point of Sale Order Cash Out Refund Cash Refund POS Refund POS Cash Refund Point of Sale Refund Point of Sale Cash Refund POS Manager validation Point Of Sale Manager Validation ",
    
    "description": """This module improves the point of sale system with features like POS Manager Validation, Order Deletion, Price Change, and various payment methods. You can choose to validate transactions using barcodes, passwords or PIN. It also allows validation for discounts, reducing quantities, processing refunds, and managing cash movements. """,
    
    "version": "0.0.7",
    "depends": ["point_of_sale"],
    "application": True,
    "data": [
        'views/view_users_form.xml',
        'views/res_config_setting.xml',
    ],
    'assets': {
        'point_of_sale._assets_pos': [
            'sh_pos_manager_validation/static/src/scss/**/*',
              'sh_pos_manager_validation/static/src/app/popups/barcode_popup/barcode_popup.js',
              'sh_pos_manager_validation/static/src/app/popups/barcode_popup/barcode_popup.xml',
              'sh_pos_manager_validation/static/src/app/popups/password_popup/password_popup.js',
              'sh_pos_manager_validation/static/src/app/popups/password_popup/password_popup.xml',
              'sh_pos_manager_validation/static/src/app/popups/validation_type_popup/validation_type_popup.js',
              'sh_pos_manager_validation/static/src/app/popups/validation_type_popup/validation_type_popup.xml',
              'sh_pos_manager_validation/static/src/app/Keyboard/keyboard.js',
              'sh_pos_manager_validation/static/src/app/Keyboard/keyboard.xml',
              'sh_pos_manager_validation/static/src/overrides/components/RefundButton/RefundButton.js',
              'sh_pos_manager_validation/static/src/overrides/models/model.js',
              'sh_pos_manager_validation/static/src/overrides/components/ticket_screen/ticket_screen.js',
              'sh_pos_manager_validation/static/src/overrides/components/product_screen/product_screen.js',
              'sh_pos_manager_validation/static/src/overrides/components/payment_screen/payment_screen.js',
              'sh_pos_manager_validation/static/src/overrides/components/navbar/navbar.js',
        ],
    },
    "auto_install": False,
    "installable": True,
    "images": ['static/description/background.png', ],
    "price": 37.26,
    "currency": "EUR"
}
