# What does Productboard roadmap scraper do?
This scraper extracts data from Productboard roadmap to a key-value store (id -- feature).
Scraped feature data includes:
 - Feature name
 - Feature description
 - Timeline(s) of feature (multiple if sub-features are in different timelines)
 - Team assigned to feature
 - List of connected sub-features
   - Sub-feature name
   - Sub-feature description
   - Timeline of sub-feature

# How to scrape Productboard roadmap?
You need to have email/password access to the Productboard set.
You also need to have a URL link to your roadmap (when you are sign-in).

## Input
Input is following:
- Productboard roadmap URL - URL to your Productboard roadmap
- User email - email of user to sign in to Productboard
- User password - password of user to sign in to Productboard
