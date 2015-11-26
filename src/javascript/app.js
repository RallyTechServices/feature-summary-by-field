Ext.define("feature-summary-by-field", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    config: {
        defaultSettings: {
            groupField: 'Release'
        }
    },

    modelName: 'PortfolioItem/Feature',
    fetch: ['FormattedID','Name','State','LeafStoryCount','LeafStoryPlanEstimateTotal','AcceptedLeafStoryCount','AcceptedLeafStoryPlanEstimateTotal','Release'],
    states: [],
    stateField: 'State',

    groupingFieldxtypeMapping: {
        release: {
            xtype: 'rallyreleasecombobox'
        }
    },

    items: [
        {xtype:'container',itemId:'selector_box'},
        {xtype:'container',itemId:'display_box'}
    ],
    launch: function() {
        Rally.data.ModelFactory.getModel({
            type: this.modelName,
            success: function(model) {
                this.model = model;
                model.getField(this.stateField).getAllowedValueStore().load({
                    callback: function(records, operation, success) {
                        this.logger.log('callback', records, operation, success);
                        if (success){
                            this.states = _.map(records, function(r){ return r.get('StringValue')});
                            this.logger.log('States: ', this.states);
                            this.addSelector();
                        } else {
                            Rally.ui.notify.Notifier.showError({message: "Error loading State field values: " + operation.error.errors.join(',')});
                        }
                    },
                    scope: this
                });
            },
            scope: this
        });
    },
    getPortfolioItemNameField: function(){
        return this.modelName.split('/').slice(-1)[0];
    },
    addSelector: function(){
        this.down('#selector_box').removeAll();
        var groupFieldConfig = this.getGroupingFieldControlConfig();
        groupFieldConfig.itemId = "group-field",
        groupFieldConfig.fieldLabel = this.model.getField(this.getGroupingField()).displayName;
        groupFieldConfig.labelAlign = 'right';
        groupFieldConfig.margin = '15 15 0 0';
        groupFieldConfig.width = 300;

        this.down('#selector_box').add(groupFieldConfig)
            .on('change', this.updateSummary, this);
    },
    updateSummary: function(cb){
        this.logger.log('updateSummary', cb);

        var fetch = this.fetch.concat([this.getGroupingField]),
            filters = this.getQueryFilter(cb);

        this.logger.log('updateSummary', fetch, filters.toString());

        var store = Ext.create('Rally.data.wsapi.Store',{
            model: this.modelName,
            fetch: fetch,
            filters: filters,
            limit: 'Infinity'
        });
        store.load({
            callback: this.mungeModelData,
            scope: this
        });
    },

    mungeModelData: function(records, operation){
        this.logger.log('mungeModelData', records, operation);
        var summaryMunger = Ext.create('Rally.technicalservices.FeatureSummary',{}),
            stateData = summaryMunger.getStateSummaryData(this.states, records);

        this.logger.log('mungeModelData stateData', stateData);

        this.down('#display_box').removeAll();
        this.addTable(stateData, summaryMunger.getStateColumnCfgs());

        this.fetchUserStories().then({
            success: function(userStories){
                summaryMunger.portfolioItemNameField = this.getPortfolioItemNameField();
                var issuesData = summaryMunger.getIssuesSummaryData(records, userStories);
                this.logger.log('mungeModelData issuesData', issuesData);
                this.addTable(issuesData, summaryMunger.getIssueColumnCfgs());
            },
            failure: function(msg){
                Rally.ui.notify.Notifier.showError({message: msg});
            },
            scope: this
        });
    },
    fetchUserStories: function(){
        var deferred = Ext.create('Deft.Deferred'),
            cmp = this.down('#group-field'),
            fetch = ['FormattedID','Blocked', 'PlanEstimate'].concat([this.getPortfolioItemNameField()]);

        this.logger.log('fetchUserStories', this.getStoryQueryFilter(cmp).toString());

        var store = Ext.create('Rally.data.wsapi.Store',{
            model: 'HierarchicalRequirement',
            filters: this.getStoryQueryFilter(cmp),
            fetch: fetch,
            limit: 'Infinity'
        });
        store.load({
            callback: function(records, operation, success){
                this.logger.log('fetchUserStories',records.length, records, operation, success);
                if (success){
                    deferred.resolve(records);
                } else {
                    deferred.reject('Error loading user stories for Features: ' + operation.error && operation.error.errors.join(','));
                }
            },
            scope: this
        });

        return deferred;
    },
    addTable: function(stateData, columnCfgs){
        var grid = Ext.create('Rally.ui.grid.Grid', {
            store: Ext.create('Rally.data.custom.Store', {
                data: stateData
            }),
            columnCfgs: columnCfgs,
            showPagingToolbar: false,
            padding: 25
        });
        this.down('#display_box').add(grid);
    },
    getStoryQueryFilter: function(cmp){
        var featurePrefix = this.getPortfolioItemNameField() + ".",
            filters = Ext.create('Rally.data.wsapi.Filter',{
                property: 'DirectChildrenCount',
                value: 0
            });
        filters = filters.and({
            property: this.getPortfolioItemNameField(),
            operator: '!=',
            value: ""
        });

        if (this.getGroupingField() === 'Release'){
            if (cmp.getValue()){
                filters = filters.and ({
                    property: featurePrefix + 'Release.ReleaseStartDate',
                    value: Rally.util.DateTime.toIsoString(cmp.getRecord().get('ReleaseStartDate'))
                });
                filters = filters.and({
                    property: featurePrefix + 'Release.ReleaseDate',
                    value: Rally.util.DateTime.toIsoString(cmp.getRecord().get('ReleaseDate'))
                });
                return filters.and({
                    property: featurePrefix + 'Release.Name',
                    value: cmp.getRecord().get('Name')
                });
            } else {
                return filters.and({
                    property: featurePrefix + 'Release',
                    value: ""
                });
            }
        }

        if (cmp.getValue){
            return filters.and({
                property: featurePrefix + this.getGroupingField(),
                value: cmp.getValue()
            });
        }
        return filters.and({
            property: featurePrefix + this.getGroupingField(),
            value: ''
        });
    },
    getQueryFilter: function(cmp){
        if (this.getGroupingField() === 'Release'){
            if (cmp.getValue()){
                var filters = Ext.create('Rally.data.wsapi.Filter', {
                    property: 'Release.ReleaseStartDate',
                    value: Rally.util.DateTime.toIsoString(cmp.getRecord().get('ReleaseStartDate'))
                });
                filters = filters.and({
                    property: 'Release.ReleaseDate',
                    value: Rally.util.DateTime.toIsoString(cmp.getRecord().get('ReleaseDate'))
                });
                return filters.and({
                    property: 'Release.Name',
                    value: cmp.getRecord().get('Name')
                });
            } else {
                return Ext.create('Rally.data.wsapi.Filter', {
                    property: 'Release',
                    value: ""
                });
            }
        }

        if (cmp.getValue()){
            this.logger.log('getQueryFilter', this.getGroupingField(), cmp.getValue());
            return Ext.create('Rally.data.wsapi.Filter', {
                property: this.getGroupingField(),
                value: cmp.getValue()
            });
        }
        return Ext.create('Rally.data.wsapi.Filter', {
            property: this.getGroupingField(),
            value: ''
        });
    },
    getGroupingField: function(){
        return this.getSetting('groupField');
    },
    getGroupingFieldControlConfig: function(){
        return this.groupingFieldxtypeMapping[this.getGroupingField().toLowerCase()] || this.getDefaultGroupingFieldConfig();
    },
    getDefaultGroupingFieldConfig: function(){
        return {
            xtype: 'rallyfieldvaluecombobox',
            model: this.modelName,
            field: this.getGroupingField()
        };
    },
    getSettingsFields: function(){
        return Rally.technicalservices.Settings.getFields(this.modelName)
    },
    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },
    
    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },
    
    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    },
    
    //onSettingsUpdate:  Override
    onSettingsUpdate: function (settings){
        this.logger.log('onSettingsUpdate',settings);
        Ext.apply(this, settings);
        this.launch();
    }
});
