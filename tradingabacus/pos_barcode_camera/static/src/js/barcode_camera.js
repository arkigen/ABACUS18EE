/** @odoo-module **/
import { PosComponent } from 'point_of_sale.PosComponent';
import Registries from 'point_of_sale.Registries';
import { useListener } from '@web/core/utils/hooks';
import { ControlButtonsMixin } from 'point_of_sale.ControlButtonsMixin';

class CameraScanButton extends PosComponent {
    setup() {
        super.setup();
        useListener("click", this.onClick);
    }

    async onClick() {
        alert("Botón Cámara cargado correctamente con imports clásicos en Odoo 17");
    }
}
CameraScanButton.template = "CameraScanButton";

Registries.Component.add(CameraScanButton);
ControlButtonsMixin.addButton(CameraScanButton);
