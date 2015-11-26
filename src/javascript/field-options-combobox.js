(function() {
    var Ext = window.Ext4 || window.Ext;

    Ext.define('Rally.ui.combobox.FieldOptionsCombobox', {
        requires: [],
        extend: 'Rally.ui.combobox.FieldComboBox',
        alias: 'widget.tsfieldoptionscombobox',

        _isNotHidden: function(field) {
            //We want dropdown fields, iteration, release, state?
            var allowedFields = ['Iteration','Release'];
            if (field && Ext.Array.contains(allowedFields, field.name)){
                return true;
            }

            if (field && !field.hidden && field.attributeDefinition &&
                field.attributeDefinition.AttributeType === 'STRING' && field.attributeDefinition.Constrained){
                return true;
            }
            return false;
        }
    });
})();