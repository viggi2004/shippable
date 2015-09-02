# shippable
programming assignment for shippable

Live URL: http://ec2-52-0-101-205.compute-1.amazonaws.com:9000

Note: octonode library is used for making git API calls.

Program flow: 

1. Make a call to git.info API to fetch the total no of open issues.  
2. Make a call to git.issues API to fetch details about issues that were opened.
3. Follow the link in headers and make paginated git.issues API call if there are more than one page of result.
4. Manually filter the data that are returned by the above calls, based on created_at field, since the git.issues API returns the issues CREATED and MODIFIED after the given date.
5. All of these run asynchronously and return the data to a final callback function where we will have the following data.
  total number of issues opened.
  issues opened in last 1 day.
  issues opened in last 1 week.
6. With this data, we can find the required fields as follows:

  a). No of issues opened more than 7 days ago = total no of issues opened - issues opened in last 1 week
  
  b). No of issues opened opened more that 24hrs ago but less than 7 days ago = issues opened in last 1 week - issues opened in last 1 day.
  
