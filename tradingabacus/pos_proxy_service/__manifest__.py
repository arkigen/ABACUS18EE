# -*- coding: utf-8 -*-
#    Copyright (C) 2007  pronexo.com  (https://www.pronexo.com)
#    All Rights Reserved.
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as
#    published by the Free Software Foundation, either version 3 of the
#    License, or (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
############################################################################## # 
# 
{
	'name': 'Pos Proxy Services',
	'summary': 'Proxy para usar odoo con impresores fiscales Argentinos para Epson / Hasar',
	'description': '''
Impresor Fiscal Epson, Impresor Fiscal Hasar Vieja y Nueva generacion

Este módulo permite la integración de impresoras fiscales Argentinas (Epson y Hasar) con Odoo POS.
Características:
- Soporte para impresoras fiscales Epson
- Soporte para impresoras fiscales Hasar (modelos antiguos y nuevos)
- Configuración simple a través de la interfaz de usuario
- Integración completa con el sistema POS de Odoo
''',
	'version': '17.0.1.0.2',
	'author': "Pronexo",
	'license': "AGPL-3",
	'maintainer': 'Pronexo',
	'category': 'sale',
        'website': 'https://www.pronexo.com',
	'depends': [
		'point_of_sale',
		'l10n_ar'
	],
	'data': [
		'views/uom_view.xml',
		'views/pos_payment_method_view.xml',
		'views/pos_config_view.xml',				
		'views/templates.xml'
	],
	'assets': {
        'point_of_sale._assets_pos': 
		[
            'pos_proxy_service/static/src/xml/pos_cierres_fiscales.xml',
            'pos_proxy_service/static/src/js/fiscal_printer_notifier.js',
            'pos_proxy_service/static/src/js/models.js',
            'pos_proxy_service/static/src/js/screens.js',
            'pos_proxy_service/static/src/js/cf_button.js',
        ],
    },
	'external_dependencies': {
   
    },
	'auto_install': False,
	'installable': True,
	'price': 50,
        'currency': 'USD',
        'images': ['images/pos-proxy-service-home.png'],
        'live_test_url': 'https://www.youtube.com/watch?v=SKFlc8bKZAI'
}
