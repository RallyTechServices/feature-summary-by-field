Ext.define('Rally.technicalservices.FeatureSummary',{

    portfolioItemNameField: null,
    noEntryText: 'No Entry',
    featureAcceptedStates: ['Accepted'],
    issues:[{
        type: 'noStories',
        displayName: 'Features Missing Leaf Stories',
        countFn: function(record){
            if (record.get('LeafStoryCount') > 0){
                return 0;
            }
            return 1;
        },
        countPctFn: function(features, count){
            return (features.length > 0 ) ? (count/features.length  * 100).toFixed(1) + ' %' : 'NaN';
        }
    },{
        type: 'unestimatedLeafStories',
        displayName: 'Unestimated Leaf Story Count',
        countFn: function(record, stories, portfolioItemNameField){
            var count = 0;
            _.each(stories, function(s){
                var planEstimate = s.get('PlanEstimate');
                planEstimate = planEstimate === null ? -1 : planEstimate;
                if (s.get(portfolioItemNameField)._ref === record.get('_ref') && planEstimate < 0){
                    count++;
                }
            });
            return count;
        },
        countPctFn: function(features, count){
            var storyCount = 0;
            _.each(features, function(f){
                storyCount += f.get('LeafStoryCount') || 0;
            });

            return (storyCount > 0 ) ? (count/storyCount  * 100).toFixed(1) + ' %' : 'NaN';
        }
    },{
        type: 'blockedStories',
        displayName: 'Blocked Leaf Stories',
        countFn: function(record, stories, portfolioItemNameField){
            var count = 0;
            _.each(stories, function(s){
                if (s.get(portfolioItemNameField)._ref === record.get('_ref') && (s.get('Blocked') === true)){
                    count++;
                }
            });
            return count;
        },
        pointsFn: function(record, stories, portfolioItemNameField){
            var points = 0;
            _.each(stories, function(s){
                if (s.get(portfolioItemNameField)._ref === record.get('_ref') && (s.get('Blocked') === true)){
                    points += s.get('PlanEstimate') || 0;
                }
            });
            return points;
        },
        countPctFn: function(features, count){
            var storyCount = 0;
            _.each(features, function(f){
                storyCount += f.get('LeafStoryCount') || 0;
            });

            return (storyCount > 0 ) ? (count/storyCount  * 100).toFixed(1) + ' %' : 'NaN';
        }
    }],

    getStateColumnCfgs: function(){
        var numberWidth = 70;
        return [{
            dataIndex: 'state',
            text: 'Feature State',
            flex: 1
        },{
            dataIndex: 'count',
            text: 'Feature Count',
            width: numberWidth
        },{
            dataIndex: 'storyCount',
            text: 'Total Stories',
            width: numberWidth
        },{
            dataIndex: 'acceptedStoryCount',
            text: 'Accepted Stories',
            width: numberWidth
        },{
            dataIndex: 'totalPoints',
            text: 'Total Points',
            width: numberWidth
        },{
            dataIndex: 'acceptedPoints',
            text: 'Accepted Points',
            width: numberWidth
        }];
    },
    getIssueColumnCfgs: function(){
        var numberWidth = 70;
        return [{
            dataIndex: 'issueName',
            text: 'Potential Issue List',
            flex: 1
        },{
            dataIndex: 'count',
            text: 'Count',
            width: numberWidth
        },{
            dataIndex: 'countPct',
            text: 'Count %',
            width: numberWidth
        },{
            dataIndex: 'points',
            text: 'Points',
            width: numberWidth
        }];
    },
    _initializeSummary: function(types){
        var summary = {},
            noEntryText = this.noEntryText;

        _.each(types, function(t){
            t = t || noEntryText;
            summary[t] = {
                count: 0,
                storyCount: 0,
                acceptedStoryCount: 0,
                totalPoints: 0,
                acceptedPoints: 0
            };
        });
        return summary;
    },

    getStateSummaryData: function(states, records){
        var stateSummary = this._initializeSummary(states),
            totalCount = 0,
            totalStoryCount = 0,
            totalAcceptedCount = 0,
            totalPoints = 0,
            totalAcceptedPoints = 0,
            noEntryText = this.noEntryText,
            acceptedFeatureCount = 0,
            featureAcceptedStates = this.featureAcceptedStates;

        _.each(records, function(r){

            var ss = (r.get('State') && r.get('State').Name) || noEntryText;
            if (ss && stateSummary[ss]){
                stateSummary[ss].count++;
                stateSummary[ss].storyCount += r.get('LeafStoryCount') || 0;
                stateSummary[ss].acceptedStoryCount += r.get('AcceptedLeafStoryCount') || 0;
                stateSummary[ss].totalPoints += r.get('LeafStoryPlanEstimateTotal') || 0;
                stateSummary[ss].acceptedPoints += r.get('AcceptedLeafStoryPlanEstimateTotal') || 0;
            }
            if (Ext.Array.contains(featureAcceptedStates, ss)){
                acceptedFeatureCount++;
            }
            totalCount++;
            totalStoryCount += r.get('LeafStoryCount') || 0;
            totalAcceptedCount += r.get('AcceptedLeafStoryCount') || 0;
            totalPoints += r.get('LeafStoryPlanEstimateTotal') || 0;
            totalAcceptedPoints += r.get('AcceptedLeafStoryPlanEstimateTotal') || 0;
        });

        var data = _.map(states, function(s){
            s = s || noEntryText;
            return {
                state: s,
                count: stateSummary[s].count || 0,
                storyCount: stateSummary[s].storyCount || 0,
                acceptedStoryCount: stateSummary[s].acceptedStoryCount || 0,
                totalPoints: stateSummary[s].totalPoints || 0,
                acceptedPoints: stateSummary[s].acceptedPoints || 0
            };
        });
        data.push({
            state: 'Total',
            count: totalCount,
            storyCount: totalStoryCount,
            acceptedStoryCount: totalAcceptedCount,
            totalPoints: totalPoints,
            acceptedPoints: totalAcceptedPoints
        });

        var acceptedCountPct = totalAcceptedCount/totalStoryCount * 100,
            acceptedPointsPct = totalAcceptedPoints/totalPoints * 100,
            acceptedFeatureCountPct = acceptedFeatureCount/totalCount * 100;

        data.push({state: '% Accepted',
            count: !isNaN(acceptedFeatureCountPct) ? acceptedFeatureCountPct.toFixed(1) + " %" : "NaN",
            storyCount: '',
            acceptedStoryCount: !isNaN(acceptedCountPct) ? acceptedCountPct.toFixed(1) + " %" : "NaN",
            totalPoints: '',
            acceptedPoints: !isNaN(acceptedPointsPct) ? acceptedPointsPct.toFixed(1) + " %" : "NaN"
        });

        return data;
    },
    getIssuesSummaryData: function(records, userStories){
        var data = [],
            portfolioItemNameField = this.portfolioItemNameField;

        userStories = _.filter(userStories, function(us){
            if (us.get('Feature')){ return true; }
        });

        _.each(this.issues, function(issue){
            var row = {type: issue.type, issueName: issue.displayName, count: 0, points: 0};
            _.each(records, function(r){
                if (issue.countFn){
                    row.count += issue.countFn(r, userStories,portfolioItemNameField);
                }
                if (issue.pointsFn){
                    row.points += issue.pointsFn(r, userStories,portfolioItemNameField);
                } else {
                    row.points = '--';
                }
            });
            if (issue.countPctFn){
                row.countPct = issue.countPctFn(records, row.count);
            } else {
                row.countPct = '--';
            }
            data.push(row);
        });
        return data;
    }
});