#Feature Summary by Field

This app shows a summary of the all of the lowest level portfolio items in scope that match a particular field value.  

The field to use for criteria is configured in the "Group Field" configuration of the App Settings.  
Any custom dropdown field, Iteration or Release can be used to group and summarize the features.  

Releases and Iterations are matched on name and date.  

The summaries include the number and points for feature states and also the number and points for 
potential feature issues.  

The feature issues include summaries of only Leaf stories that belong to the feature.  Thus, if a leaf story is blocked, only the plan estimates for that story will be included in the points count for blocked stories.  The plan estimates for the story's blocked parent(s) will not be included. 

This app assumes the lowest level portfolio item is called a "PortfolioItem/Feature".  

![ScreenShot](/images/feature-by-field.png)

For an app that shows summaries for user stories, see the story-summary-by-field app.  