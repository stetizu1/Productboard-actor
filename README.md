# What does Productboard roadmap scraper do?
This scraper extracts data from Productboard roadmap to a key-value store (OUTPUT) as a map (id -- feature).
Scraped feature data includes:
 - Feature name
 - Feature description
 - Timeline(s) of feature (multiple if sub-features are in different timelines)
 - Team assigned to feature
 - List of connected sub-features
   - Sub-feature name
   - Sub-feature description
   - Timeline of sub-feature

## Scraped data use case
Actor extracts data from the productboard roadmap to a JSON file.
You can use data to your own use cases, such as:
- Creating a summary of the roadmap
- Aggregating data from multiple roadmaps
- Make your own roadmap visualization


# How to scrape Productboard roadmap?
You need to have email/password access to the Productboard set.
You also need to have a URL link to your roadmap (when you are sign-in).

## Input
Input is following:
- Productboard roadmap URL - URL to your Productboard roadmap
- User email - email of user to sign in to Productboard
- User password - password of user to sign in to Productboard

## Ouput
Output is present in a key-value store as `OUTPUT`.

Output is a map of features, where key is a feature id and value is an object:
```
type FeatureId = string

type ResultMap = Record<FeatureId, {
    title: string
    description: string
    timeline: string[]
    team: string
    features: Record<FeatureId, {
        title: string
        description: string
        timeline: string
    }>
}>

```

Example output:
```
  "123": {
    "title": "Customer Profile Enhancements",
    "description": "The goal of this feature is to enhance the [customer profile section](https://blog.hubspot.com/service/customer-profiling) to provide a more comprehensive view of customer data and improve user experience.\n",
    "timeline": [
      "Now",
      "Next"
    ],
    "team": "FE team",
    "features": {
      "321": {
        "title": "UI redesign",
        "description": "Revamp the customer profile page layout to accommodate new sections and improve overall aesthetics.",
        "timeline": "Now"
      }
      "322": {
        "title": "Timeline Component Implementation",
        "description": "Develop and integrate a timeline component to display recent customer activities and interactions in a chronological order.",
        "timeline": "Next"
      }
    }
  }
```
