# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.

{
    "name" : "POS Membership Management in Odoo",
    "version" : "17.0.0.1",
    "category" : "Point of Sale",
    "depends" : ['base','sale','point_of_sale'],
    "author": "BrowseInfo",
    'summary': 'App helps POS Loyalty Management pos loyalty pos rewards pos club membership POS by Loyalty Program POS Loyalty Program pos customer loyalty POS membership card Program Point of Sale Bonus Gift POS Referral pos club Membership Card for provide Discount ',
    "description": """
    
    Purpose :- 
This apps allows your cutomers to provide 
odoo pos Membership Card for provide Discount on their orders pos
Odoo POS Membership card Management POS Membership Management pos user membership POS
Odoo use membership pos customer membership pos
odoo pos customer membership customer membership pos
Odoo pos membership cards point of sale Membership Management
odoo point of sales Membership management point of sale Membership card Management
odoo point of sales Membership card management Membership card with POS
odoo POS loyal membership loyality membership in pos
odoo Seller can create various membership categories with some associated discounts Membership cards are created and assigned to the customers.
odoo Customers can use their membership cards to avail discount on their orders Seller can apply membership card by scanning membership card barcode.
odoo Customer Membership with POS Customer Membership on POS in Odoo
odoo customer Membership card on POS Customer Membership with point of sales in Odoo
odoo Customer Membership on  point of sales customer Membership card on  point of sales in Odoo
odoo customer Membership on POS customer Membership on point of sale in Odoo
odoo customer Membershipcard on POS customer Membershipcard on point of sale in Odoo
    
    """,
    "website" : "https://www.browseinfo.com",
    "price": 99,
    "currency": "EUR",
    "data": [
        'security/ir.model.access.csv',
        'wizard/pos_top_clients.xml',
        'views/custom_pos_view.xml',
        'views/print_front_img_report.xml',
        'views/print_back_img_report.xml',
        'views/print_full_front_img_report.xml',
        'views/print_full_back_img_report.xml',
        'views/pos_membership.xml',
        'views/membership_code_report.xml',
        'views/report_pos_membership_code.xml',
        'views/top_client_wizard_report.xml',
    ],
            

    'assets': {
        'point_of_sale._assets_pos': [
            "pos_membership_odoo/static/src/js/pos.js",
            "pos_membership_odoo/static/src/js/Popup/ApplyMembershipPopupWidget.js",
            "pos_membership_odoo/static/src/js/Screens/MemberScreenWidget.js",
            'pos_membership_odoo/static/src/xml/**/*',
        ],
    },
    
    "license":'OPL-1',
    "auto_install": False,
    "installable": True,
    'live_test_url':"https://youtu.be/0nGQg7AgzQU",
    "images":['static/description/Banner.gif'],
}
# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
