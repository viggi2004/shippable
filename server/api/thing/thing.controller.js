/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /things              ->  index
 * POST    /things              ->  create
 * GET     /things/:id          ->  show
 * PUT     /things/:id          ->  update
 * DELETE  /things/:id          ->  destroy
 */

'use strict';

var      _ = require('lodash');
var github = require('octonode');
var client = github.client();
var moment = require('moment');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var token = '';
var paginatedCount = {'lastday':0,'lastweek':0};
//var paginatedCount['lastweek'] = 0;

exports.getissues = function(req, res) {
 var lastday  = moment().subtract(1,'days').format();
 var lastweek = moment().subtract(7,'days').format();
 console.log('lastday: '+lastday);
 console.log(decodeURIComponent(req.query.repo));
 var github   = client.repo(decodeURIComponent(req.query.repo));
 //var github   = client.repo('Shippable/support');
 var response = {'total_open_issues':0,'one_day':0,'one_week':0,'before_one_week':0};
 eventEmitter.on('added',addedListener);
 github.info(function(err,data,headers){
  if(err)
    handleError(res,err);
  else if(data.has_issues==true)
 {
    response.total_open_issues=data.open_issues;
    console.log('response has issues with count '+response.total_open_issues);
    eventEmitter.emit('added','a',res,response);
    console.log('after eventEmitter');
    setSinceCount(github,response,headers,lastday,res,'lastday');
    setSinceCount(github,response,headers,lastweek,res,'lastweek'); 
 }
  });
 

 

};
function addedListener(currentToken,res,response)
{
  console.log('inside eventemitter function')
  token=token+currentToken;
  console.log('token: '+token);
  if(token.length==3)
  {
    eventEmitter.removeAllListeners('added');
    console.log(response);
    response.before_one_week = response.total_open_issues - response.one_week;
    response.one_week = response.one_week - response.one_day;
    token='';
    return res.json(response);    
  }
}

function setSinceCount(github,response,headers,since,res,flag)
{
  console.log('calling sincecount for '+flag);
  github.issues({per_page:100,page:1,since:since},function(err,data,headers){
    if(err)
      handleError(res,err);

    //console.log(data);
    else if(data.length<100)
    {
      var filteredcount=0;
      console.log('since '+since);
      for(var i=0;i<data.length;i++)
      {
        if(data[i].created_at>=since)
        {
           filteredcount=filteredcount+1;
           console.log(data[i].title);
        } 

      }
      
    console.log('triggering first call, data: '+filteredcount);
      if(flag=='lastday')
      {
        console.log('lastday < 100');
        console.log(JSON.stringify(data));
        response.one_day=filteredcount;
        eventEmitter.emit('added','a',res,response);
      } 
      else if(flag=='lastweek')
      {
        console.log('lastweek < 100');
        response.one_week=filteredcount;
        eventEmitter.emit('added','a',res,response);
      }
      //res.json(response);
    }
    else
    {
      var links = headers.link;
      var links = links.split(',');
      var lastpagelink = -1;
      for(var i=0;i<links.length;i++)
      {
        if(links[i].search('rel="last"')!=-1)
        {
          console.log('currentlink: '+links[i]);
          var lastpageno=Number(links[i].match(/<.*page=(.*)&.*>/)[1]);
          console.log('lastpageno: '+lastpageno+' since: '+since);
          for(var i=1;i<=lastpageno;i++)
          (function(i){ 
            console.log('pulling page '+i);
            github.issues({per_page:100,page:Number(i),since:since},function(err,data,headers){
            if(err)
              handleError(res,err);
            else
            {
              var filteredcount=0;
              for(var j=0;j<data.length;j++)
              {
                if(data[j].created_at>=since)
                  filteredcount=filteredcount+1;
              }
              paginatedCount[flag] = paginatedCount[flag]+filteredcount;

              console.log(flag+' '+i+', count '+filteredcount);
              console.log(JSON.stringify(paginatedCount));
              if(i==lastpageno)
              {
                response.one_day  = paginatedCount['lastday'];
                response.one_week = paginatedCount['lastweek'];
                return res.json(response);
              }
              // else if(flag=='lastday')
              // {
              //   console.log('triggering lastday size '+data.length);
              //   response.one_day = data.length+((lastpageno-1)*100);
              //   eventEmitter.emit('added','a',res,response);
              // }  
              // else if(flag=='lastweek')
              //  { 
              //   console.log('triggering lastweek size '+data.length);
              //   response.one_week = data.length+((lastpageno-1)*100); 
              //   eventEmitter.emit('added','a',res,response);
              //  }//res.json(response);
            }
            });
          })(i);
          break;
        }
      }
      
    }
});
}

function handleError(res, err) {
  console.log(err);
  if(err && err.headers['x-ratelimit-remaining']=='0')
  return res.send(400, 'Rate limit exceeded. Please try again after sometime.');
}