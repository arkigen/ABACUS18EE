# -*- coding: utf-8 -*-
{
    'name': "POS Membership",

    'summary': """Membership unlimited code""",

    'description': """""",

    'author': "WECO.co",
    'website': "https://api.whatsapp.com/send%20phone=+573016482804",
    'category': 'point_of_sale',
    'version': '17.0.0.1',
    'depends': [
                'base', 
                'point_of_sale', 
                'pos_membership_odoo'
               ],
    "data": [
                'views/pos_membership_setting.xml',
            ],
    'assets': {
                'web.assets_common':    [
                                            "pos_membership_odoo_inherit/static/src/js/point_of_sale.js",
                                        ]
              },
}