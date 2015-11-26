Ext.define('Rally.technicalservices.Settings',{
    singleton: true,

    getFields: function(modelName){
        var labelWidth = 150;

        return [{
            xtype: 'tsfieldoptionscombobox',
            name: 'groupField',
            model: modelName,
            labelWidth: labelWidth,
            labelAlign: 'right',
            fieldLabel: 'Group Field'
        }];
    }
});
