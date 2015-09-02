
'use strict';

var      _ = require('lodash');
var github = require('octonode');
var client = github.client();
var moment = require('moment');
var events = require('events');
var async  = require('async');

exports.getissues = function(req,res){
  var github   = client.repo(decodeURIComponent(req.query.repo));
  var fetchAndFilterIssues = function(since,callback){
      github.issues({per_page:100,since:since},function(err,data,headers){
      if(err){       
        callback(err,null);
        return;
      }
      if(!('link' in headers)) //link key is available only when there are more that 1 page
      {
        var singlepagecount=0;
        for(var j=0;j<data.length;j++)
        {
            if(data[j].created_at>=since)
              singlepagecount=singlepagecount+1;
        }
        callback(null,singlepagecount);
        return;
      }
      var links = headers.link;
      var links = links.split(',');
      var lastpageno=0;
      var count=1;
      var filteredcount=0;
      for(var i=0;i<links.length;i++)
      {
        if(links[i].search('rel="last"')!=-1)
        {
          lastpageno=Number(links[i].match(/&page=(\d+)/)[1]);
          for(var j=0;j<data.length;j++)
          {
              if(data[j].created_at>=since)
                filteredcount=filteredcount+1;
          }
          break;
        }
      }
      if(lastpageno>1)
      {
          async.whilst(
            function(){
              return count<lastpageno;
            },
            function(callback){
              count++;
              github.issues(count,100,function(err,data,headers){
    
                for(var j=0;j<data.length;j++)
                {
                  if(data[j].created_at>=since)
                    filteredcount=filteredcount+1;
                }
                callback();     
              });
            },
            function(err){
              if(err)
              {
                callback(err,null);
                return;
              } 
              callback(null,filteredcount); // last callback of the async.parallel
            }
          );
      }  
    }); // end github.issues
  }//end fetchAndFilterIssues
  async.parallel({
    total_open_issues : function(callback){
      github.info(function(err,data,headers){
        if(err)
          callback(err,null);
        else
        {
          callback(null,data.open_issues);
        }
      });
    },
    within_one_day : function(callback){
      var lastday  = moment().subtract(1,'days').format();
      fetchAndFilterIssues(lastday,callback);   
    },
    within_one_week : function(callback){
      var lastweek = moment().subtract(7,'days').format();
      fetchAndFilterIssues(lastweek,callback);   
    }
  },
  
    function(err,results){
      if(err)
      {
         if(err.headers['x-ratelimit-remaining']=='0')
          res.send({'error':'Rate limit exceeded. Please try again after sometime'});
         else if(err.statusCode==404)
          res.send({'error':'Repository not found. Please check the repository name'});
         else
          res.send({'error':'Oops!! Something wicked happened'});
      } 
      else{
      results.before_one_week = results.total_open_issues - results.within_one_week;
      results.within_one_week = results.within_one_week - results.within_one_day;
      res.json({'error':null,'data':results});
      }
    }
  ); //end async.parallel



}// end getissues