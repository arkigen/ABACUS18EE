/** @odoo-module */

import { AbstractAwaitablePopup } from "@point_of_sale/app/popup/abstract_awaitable_popup";
import { _t } from "@web/core/l10n/translation";
import { useService } from "@web/core/utils/hooks";
import { usePos } from "@point_of_sale/app/store/pos_hook";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
import { useBarcodeReader } from "@point_of_sale/app/barcode/barcode_reader_hook";
import { onMounted } from "@odoo/owl";
import { OnScreenKeyBoard } from "@sh_pos_manager_validation/app/Keyboard/keyboard";

export class passwordPopup extends AbstractAwaitablePopup {
    static template = "sh_pos_manager_validation.passwordPopup";
    static components = { OnScreenKeyBoard };

    setup() {
        super.setup();
        this.props.confirmKey = ""
        this.pos = usePos();
        onMounted(this.onMounted);
    }
    onMounted(){
        $('#password').focus()
        var self = this;
        $('.numlock').click(function () {
            if ($('.numlock')){
              self.toggleNumLock();
              return false;
          }
        })
      }
      toggleNumLock(){
        $('.symbol span').toggle();
        $('.numlock span').toggle();
        this.numlock = (this.numlock === true ) ? false : true;
      }
    open_keyboard(){
      if(this.pos.config.sh_virtual_keyboard){
        var self = this;
        if($('.keyboard_frame') && $('.keyboard_frame').length){
          $('.keyboard_frame').css('height', '230px').show()
          const virtualKeyboard = document.querySelector('.keyboard');
          const inputField = document.getElementById('password');
          virtualKeyboard.onclick = function(event) {
            const key = event.target;
            var $this = $(key)
            if ($this.hasClass('space'))  inputField.value += ' ';
            if (event.target.matches('li.symbol')) {
             const offValue = key.querySelector('.off').textContent;
             const onValue = key.querySelector('.on').textContent;
             if (self.numlock){
                 inputField.value += onValue;
             }else{
               inputField.value += offValue;
             }
             $(inputField).focus()
            } else if (event.target.matches('li.delete')) {
              inputField.value = inputField.value.slice(0, -1);
            }
          };

        }
      }
    }
}
