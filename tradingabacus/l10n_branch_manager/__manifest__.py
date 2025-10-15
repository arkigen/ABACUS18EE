{
    'name': 'Branch Manager',
    'version': '18.0',
    'category': 'Localization',
    'summary': 'Branch management features for multi-company setup',
    'author': 'WECO',
    'website': '',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'account',
        'web',
        'website',
        'website_sale',
        'point_of_sale',
        'l10n_co_edi_jorels_pos'
    ],
    'data': [
    ],
    'assets': {
        'point_of_sale._assets_pos': [
            'l10n_branch_manager/static/src/js/payment_screen.js',
            #'l10n_branch_manager/static/src/xml/payment_screen.xml',
        ],
    },
    'demo': [],
    'installable': True,
    'auto_install': False,
    'application': False,
} 