/** @odoo-module */

import { Component, xml } from "@odoo/owl";

export class OnScreenKeyBoard extends Component {
    static template = "sh_pos_manager_validation.OnScreenKeyBoard";

    setup(){
        super.setup()
    }
    clickEnter() {
        $('.keyboard_frame').css({ 'height': '0px', 'display': 'none' });
    }
    shCloseKeyboard() {
        $('.keyboard_frame').css({ 'height': '0px', 'display': 'none' });
    }
}
