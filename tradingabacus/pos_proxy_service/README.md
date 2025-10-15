# POS Proxy Service for Odoo 17

This module provides integration between Odoo POS and Argentinian fiscal printers (Epson/Hasar).

## Features

- Connect Odoo POS with fiscal printers through a proxy service
- Support for Hasar 250 and Epson T900FA printers
- Fiscal closing operations (X/Z reports)
- Automatic tax identification based on client AFIP responsibility type
- Compatible with Odoo 17.0

## Configuration

1. Enable the fiscal printer option in the POS configuration
2. Set the fiscal printer IP address (default: http://127.0.0.1:5005)
3. Select the printer model (Hasar 250 or Epson T900FA)

## Requirements

- Odoo 17.0
- An external proxy service that connects to the fiscal printers

## Technical notes

This module was updated from Odoo 14 to be compatible with Odoo 17's new architecture and component system.

## Author

Pronexo (https://www.pronexo.com) 