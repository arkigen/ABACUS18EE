# -*- coding: utf-8 -*-
{
    'name': "account_move_report",

    'summary': """
    
    """,

    'description': """
        Long description of module's purpose
    """,

    'author': "",
    'website': "",
    'category': 'Uncategorized',
    'version': '0.1',
    'depends': [
                    'base', 
                    'account',
                    'sale',
                    'payment',
                    'account_reports',
                    'account_accountant',
                    'account_payment',
                    
                ],
    'data': [  
                'views/document_tax_totals.xml',
                'views/report_proforma.xml',
                'views/action_reports.xml',
            ]
}
