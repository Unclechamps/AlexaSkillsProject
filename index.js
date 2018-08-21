'use strict';

// Setting up dependencies //
var axios = require('axios');
var Alexa = require('alexa-sdk');

// Capturing dates needed for queries //
var date = new Date();
var year = date.getFullYear();
var month = date.getMonth()+1;
var dt = date.getDate();
var ydt = date.getDate()-1;
var tdt = date.getDate()+1;

if (dt < 10) {
  dt = '0' + dt;
}
if (month < 10) {
  month = '0' + month;
}

var today = year.toString()+month.toString()+dt.toString()
var yesterday = year.toString()+month.toString()+ydt.toString()
var tomorrow = year.toString()+month.toString()+tdt.toString()

// Alexa handlers //
var handlers = {


// Responds when no utternaces are present : e.g. "Open Digital Crafts" //
"LaunchRequest": function() {
    this.response.speak("Welcome to Digital Crafts Project Management. What can I help you with?").listen("What can I help you with?");
    this.emit(':responseReady');

  },

"userListOfProjects": function() {

  var token = this.event.context.System.user.accessToken;

  axios({
    method: 'get',
    url:"https://alexalapraim.teamwork.com/projects.json?status=ACTIVE",
    headers: {
            'Content-Type' : 'application/json',
            'Accept' : 'application/json',
            'Authorization' : "Bearer " + token
    }
  }).then((response) => {
    if(response.data.projects.length === 0) {
      this.response.speak("The are no projects assigned to you.");
      this.emit(":responseReady")
    } else {

      var totalProjects = []

      for (let i=0; i <response.data.projects.length; i++) {
        var projectName = response.data.projects[i].name

        totalProjects.push(projectName)
      }

      var responseString = "The following projects were assigned to you: " + totalProjects.join(", ");

      this.response.speak(responseString);
      this.emit(":responseReady")
    }
  })
},


// Responds when user asks foro open overdue tasks //
"overdueProjectIntent": function() {

  var token = this.event.context.System.user.accessToken;
  //fetch API//
  axios({
    method: 'get',
    url:"https://alexalapraim.teamwork.com/tasks.json?filter=overdue",
    headers: {
            'Content-Type' : 'application/json',
            'Accept' : 'application/json',
            'Authorization' : "Bearer " + token
    }
  }).then((response) => {

    // if no items are overdue, Alexa will respond //
    if(response.data['todo-items'].length === 0) {
        this.response.speak("There are currently no tasks overdue.");
        this.emit(":responseReady");
    } else {
        // if there is/are item(s) in the list, Alexa will run a for loop //
        var array = [];
        var i = 0;
        let numberOverdue = response.data['todo-items'].length;
        for(i; i < response.data['todo-items'].length; i++) {
          let numberTask = i + 1;
          let dateAgo = parseInt(today) - parseInt(response.data['todo-items'][i]['due-date']);
          let taskContent = response.data['todo-items'][i].content;
          let projectName = response.data['todo-items'][i]['project-name'];

          let stringAlexa = "Task "+numberTask+", " + taskContent + " for Project " + projectName + ", was due " + dateAgo + " days ago." ;

          array.push(stringAlexa);
        }
      // if only 1 item in the array, Alexa will respond //
      if (numberOverdue == 1) {
        var responseString = "Only " + numberOverdue + " task is overdue. " + array.join(" ");

        this.response.speak(responseString);
        this.emit(":responseReady");
     } else {

      // Response when multiple items in the array //
      var responseString = "A total of " + numberOverdue + " tasks are overdue. " + array.join(" ");

      // respond from Lambda tu Alexa //
      this.response.speak(responseString);
      this.emit(":responseReady");
    }
    }
  })
},

"completedTasksIntent": function() {

    var token = this.event.context.System.user.accessToken;

    axios({
      method: 'get',
      url:"https://alexalapraim.teamwork.com/completedtasks.json?startdate="+yesterday+"&enddate="+today,
      headers: {
              'Content-Type' : 'application/json',
              'Accept' : 'application/json',
              'Authorization' : "Bearer " + token
      }
    }).then((response) => {
      if(response.data.tasks.length === 0) {
        this.response.speak("There were no tasks completed in the past twenty four hours.");
        this.emit(":responseReady");
      } else {
      var array = [];
      var i = 0;
      let numberCompleted = response.data.tasks.length;
      for(i; i < response.data.tasks.length; i++) {
        let numberTask = i + 1;
        let completer = response.data.tasks[i].completerFirstName;
        let taskContent = response.data.tasks[i].content;
        let completedOn = response.data.tasks[i].completedOn;
        let projectName = response.data.tasks[i].projectName;

        let stringAlexa = "Task "+numberTask+", " + taskContent + " for Project " + projectName + ", was completed by " + completer + "." ;

        array.push(stringAlexa);
      }

      if (numberCompleted == 1) {
        var responseString = "Only " + numberCompleted + " task was completed in the past 24 hours. " + array.join(" ");

        this.response.speak(responseString);
        this.emit(":responseReady");
     } else {

      var responseString = "A total of " + numberCompleted + " tasks were completed in the past 24 hours. " + array.join(" ");

      this.response.speak(responseString);
      this.emit(":responseReady");
      // console.log(responseString)
    }}
    })
    },




  'projectStatusIntent': function() {
    var project = this.event.request.intent.slots.projectName.value;
    var projectName = project.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '').toLowerCase()
    // var projectName = "Alexa"
    var projectId = 0;

    var token = this.event.context.System.user.accessToken;

    axios({
      method: "get",
      url: "https://alexalapraim.teamwork.com/projects.json?status=ACTIVE",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        'Authorization' : "Bearer " + token
      }
    }).then(response => {
      // console.log(response.data.projects[0].name)
      if (response.data.projects.length === 0) {
        this.response.speak("There are no projets with that name.");
        this.emit(":responseReady");
      } else {
        var projectId = ''
        for (let i = 0; i < response.data.projects.length; i++) {

          var projectTW = response.data.projects[i].name;
          var projectTWLC = projectTW.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '').toLowerCase();

          if (projectTWLC === projectName) {

            projectId = response.data.projects[i].id;

            return projectId
          }
        }}
      }).then(projectId => {

        axios({
          method: "get",
          url:
            "https://alexalapraim.teamwork.com/projects/" +
            projectId +
            "/tasks.json",

          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            'Authorization' : "Bearer " + token
          }
        }).then(response => {
          if (response.data["todo-items"].length === 0) {
            this.response.speak(
              "There were no tasks assigned for the " + projectName + "project."
            );
            this.emit(":responseReady");
          } else {
            var totalTasksArray = [];

            let totalTasks = response.data["todo-items"].length;
            for (let i = 0; i < response.data["todo-items"].length; i++) {
              let taskNumber = i + 1;
              let taskContent = response.data["todo-items"][i].content;
              let responsiblePerson =
                response.data["todo-items"][i]["responsible-party-firstname"];

              let startDate = response.data["todo-items"][i]["start-date"];
              let startDateDFormat = startDate.replace(
               /(\d\d\d\d)(\d\d)(\d\d)/,
               "$1/$2/$3"
             );

              let dueDate = response.data["todo-items"][i]["due-date"];
              let dueDateDFormat = dueDate.replace(
               /(\d\d\d\d)(\d\d)(\d\d)/,
               "$1/$2/$3"
             );


              let stringAlexa = "Task " + taskNumber + ", " + taskContent + " is assigned to " + responsiblePerson + " with a due date of " + dueDateDFormat + ".";

              totalTasksArray.push(stringAlexa);
            }

            if (totalTasks == 1) {
              var responseString = "Only " + totalTasks + " task is assigned for the " + projectName + "project." + array.join(" ");

              this.response.speak(responseString);
              this.emit(":responseReady");
            } else {
              var responseString = "A total of " + totalTasks + " tasks are currently open for the " + projectName + " project. " + totalTasksArray.join(" ");

              this.response.speak(responseString);
              this.emit(":responseReady");
           }
          }
          })
        })
    },

    "createProjectIntent": function() {

      var token = this.event.context.System.user.accessToken;

      let projectName = this.event.request.intent.slots.projectName.value;
      let projectDescription = this.event.request.intent.slots.projectDescription.value;
      let startDate_String = this.event.request.intent.slots.startdate.value;
      let endDate_String = this.event.request.intent.slots.enddate.value;

      if(startDate_String && endDate_String) {

        var startDate = new Date(startDate_String).toISOString().slice(0, 10).replace(/-/g, "");

        var endDate = new Date(endDate_String).toISOString().slice(0, 10).replace(/-/g, "");
      }

      let newProject = {
        project: {
          name: projectName,
          description: projectDescription,
          startDate: startDate,
          endDate: endDate
        }
      };

      axios({
        method: "post",
        url: "https://alexalapraim.teamwork.com/projects.json",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          'Authorization' : "Bearer " + token
        },
        data: newProject
      }).then(response => {
        if ((response.data.STATUS = "OK")) {
          this.response.speak(newProject.project.name + " was created");
          this.emit(":responseReady");
        } else {
          this.response.speak("An error occured while creating the project");
          this.emit(":responseReady");
        }
      }).catch(error => {
        var errorMessage = error.response.statusText

        this.response.speak("An error occured while creating the project. This project " + errorMessage);
        this.emit(":responseReady")
      });
    },

    "deleteProjectIntent": function() {
      var projectName = this.event.request.intent.slots.projectName.value;
      //.replace() method to remove all the special characters
      var projectName_USER = projectName.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "").toLowerCase();

      var projectId = "";

      var token = this.event.context.System.user.accessToken;

      axios({
        method: "get",
        url: "https://alexalapraim.teamwork.com/projects.json",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          'Authorization' : "Bearer " + token
        }
      })
        .then(response => {
          if (response.data.projects.length === 0) {
            this.response.speak("There are no projets with that name.");
            this.emit(":responseReady");
          } else {
            for (let i = 0; i < response.data.projects.length; i++) {
              var projectName_TW = response.data.projects[i].name;
              var projectName_TWLC = projectName_TW.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "").toLowerCase();
              //console.log(newProjectName);
              if (projectName_TWLC === projectName_USER) {
                projectId = response.data.projects[i].id;
                break;
              }
            }
            return projectId;
          }
        })
        .then(projectId => {
          axios({
            method: "delete",
            url:
              "https://alexalapraim.teamwork.com/projects/" + projectId + ".json",

            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
              'Authorization' : "Bearer " + token
            }
          }).then(response => {
            if (response.data.STATUS == "OK") {
              this.response.speak(projectName + " was deleted");
              this.emit(":responseReady");
            } else {
              this.response.speak(
                "An error occured while deleting the " +
                  projectName +
                  "Do you want to try again?"
              );
              this.emit(":responseReady");
            }
          });
        });
    },


 'AMAZON.StopIntent': function() {
    this.response.speak('Ok, thanks for visiting!');
    this.emit(':responseReady');
  },

  'AMAZON.CancelIntent': function() {
    this.response.speak('Ok, thanks for visiting!');
    this.emit(':responseReady');
  },

  'AMAZON.HelpIntent': function () {
    const speechOutput = 'You can say tell me what projects were completed in the past 24 hours, or, you can say stop... What can I help you with?';
    const reprompt = 'What can I help you with?';

    this.response.speak(speechOutput).listen(reprompt);
    this.emit(':responseReady');
},

  'AMAZON.FallbackIntent' : function() {
    const speechOutput = "Not sure I understand. You can say: what tasks were completed in the past twenty four hours? or, what tasks are overdue?";
    const reprompt = 'What can I help you with?';

    this.response.speak(speechOutput).listen(reprompt);
    this.emit(':responseReady');
},

  'Unhandled': function() {
  this.emit(':tell', 'Thanks for talking to me!');
  },

};

exports.handler = function(event, context, callback){
  var alexa = Alexa.handler(event, context, callback);
  alexa.registerHandlers(handlers);
  alexa.appId = 'amzn1.ask.skill.f76328b6-aecc-41cd-be35-07672700e78a';
  alexa.execute();
};
