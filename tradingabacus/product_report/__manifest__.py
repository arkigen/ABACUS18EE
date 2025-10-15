# -*- coding: utf-8 -*-
{
    'name': "product_report",

    'summary': """Reports""",

    'description': """report for actions forms""",

    'author': "WECO",
    'website': "",
    'category': 'Uncategorized',
    'version': '17.0.0.1',
    'depends': [
                'account',
                'product',
               ],
    'data': [
                'report/product_product_templates.xml',
            ],
    'web.report_assets_common': [
                                    'product_report/static/src/scss/report_label_sheet.scss',
                                ],
}