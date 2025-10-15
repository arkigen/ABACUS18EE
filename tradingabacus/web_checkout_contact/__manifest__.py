# -*- coding: utf-8 -*-
{
    'name': "web_checkout_contact",
    'summary': """Collect contact details for an invoice""",
    'description': """ """,
    'author': "WECO.co",
    'website': "WECO.co",
    'category': 'Uncategorized',
    'version': '18.0.1.0.0',
    'depends': [
                    'base',
                    'contacts',
                    'web',
                    'website',
                    'website_sale',
                    'l10n_latam_base',
                    'l10n_co_edi_jorels',
               ],
    'data': [
                'views/models/res_partner.xml',
                'views/website/res_partner.xml',
                'views/models/document_types.xml',
                'data/l10n_latam.identification.type.csv'
            ],
    'assets':   {
               'web.assets_frontend': [
                                       "/web_checkout_contact/static/src/js/checkout_address.js",
                                       "/web_checkout_contact/static/src/css/checkout_address.css",
                                       ],
                # "web.assets_backend": [
            #                             "/web_checkout_contact/static/src/js/contact.js",
                #                        ],
                }
}
