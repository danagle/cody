
//Johan Coppieters 
//- mar 2011 - rWorks
//- mar 2013 - jCMS



///////////////////////
//tree functions    //
///////////////////////
function jAtomTree(theRoot, theInitialNode, theContext, theLanguage, theService, theImages) {
    
// theRoot: is prefilled by the calling template (0, 1, ...)
// theInitialNode: select this node and open the tree up to there
// theLanguage: current language  of the cms
// theContext: prefix for http calls to the cms
// theService: is prefilled by the calling template (images, files, forms, ...) */
// theImages: location of the static images of the cms
  
  
this.currentNode = "";
this.pleaseOpen = null;
this.rootId = "id_"+theRoot;
this.nextType = "";

this.warnUser = function(message) {
  $('#right_cont').html("<p class='warning'>" + message + "</p>");
};

this.getNode = function(id) {
  var self = this;
  
  if (id != self.rootId) {
    $.ajax({
      type: "GET", 
      url: theContext + "/" + theLanguage + "/"+theService,
      data: "request=getnode&node=" + id,
      success: function(msg){
        if (msg.substring(0,3) == "NOK") {
          self.warnUser("Got error from server: " + msg);
               
        } else if (msg.substring(0,3) == "NAL") {
          self.warnUser("You are not allowed to edit this node, sorry.");
              
        } else {
          self.currentNode = id; 
          $("#right_cont").html(msg).show();  
            
          $("#doRealDelete").button({ icons: { primary: "ui-icon-trash"}, text: true}).click( function() { self.doRealDelete(); } );
          $("#doSave").button({ icons: { primary: "ui-icon-check"}, text: true}).click( function() { self.doSave(); } );
        }
      }
    });
  }
};

this.doSave = function() {
  $("form#onepage #request").val("save");
  $("form#onepage").submit();
};

this.doRealDelete = function() {
  $("form#onepage #request").val("realdelete");
  $("form#onepage").submit();
};

this.doAdjust = function() {
  $("form#onepage #request").val("adjust");
  $("form#onepage").submit();
};


this.doAdd = function() {
  var self = this;
  var t = $("#tree").jstree("get_selected"); 
  if (t) {
    $("#sitemap").jstree("create", t, "inside");
  } else {
    self.warnUser("Please select an item first");
  }
};
this.doAddFolder = function() {
  var self = this;
  var t = $("#tree").jstree("get_selected"); 
  self.nextType = "folder";
  if (t) {
    $("#tree").jstree("create", t, "inside", ({ attr: { rel : "folder" } })); 
  } else { 
    self.warnUser("Please select an item first");
  }
};
this.doAddImage = function () {
  var self = this;
  var t = $("#tree").jstree("get_selected"); 
  self.nextType = "image";
  if (t) {
    $("#tree").jstree("create", t, "inside", ({ attr: { rel : "image" } })); 
  } else { 
    self.WarnUser("Please select an item first");
  }
};
this.doRename = function() {
  var self = this;
  var t = $("#tree").jstree("get_selected"); 
  if (t) {
    $("#tree").jstree("rename", null); // renames current selection
  } else {
    self.warnUser("Please select an item to rename first");
  }
};
this.doDelete = function() {
  var self = this;
  var t = $("#tree").jstree("get_selected"); 
  if (t) {
    $("#tree").jstree("remove", t);
  } else {
    self.warnUser("Please select an item to delete first");
  }
};
this.doEdit = function(aNode) { 
  var self = this; 
  var t = $("#tree").jstree("get_selected"); 

  if (aNode != null) {
    self.getNode(aNode);
  } else if (t) {
    self.getNode(t.attr("id"));
  } else {
    self.warnUser("Please select an item to edit first");
  }
};


this.init = function () { 
  var self = this;

  // not all buttons exist for every atom tree user
  $("#doAdd").button({ icons: { primary: "ui-icon-plus"}, text: true}).click(function() { self.doAdd(); });
  $("#doAddFolder").button({ icons: { primary: "ui-icon-plus"}, text: true}).click(function() { self.doAddFolder(); });
  $("#doAddImage").button({ icons: { primary: "ui-icon-plus"}, text: true}).click(function() { self.doAddImage(); });
  $("#doRename").button({ icons: { primary: "ui-icon-pencil"}, text: true}).click(function() { self.doRename(); });
  $("#doDelete").button({ icons: { primary: "ui-icon-trash"}, text: true}).click(function() { self.doDelete(); });
  $("#doEdit").button({ icons: { primary: "ui-icon-wrench"}, text: true}).click(function() { self.doEdit(); });

  
  $("#tree")

  .bind("before.jstree", function(e, data) {
    var aNode = data.args[0]; 
    var nodeId = (typeof aNode == "object") ? $(aNode).attr("id") : "id_xx";

    if (data.func === "delete_node") {
      if (theService === "sitemap") { 
        // we don't actually do deletes for webpages, just mark the node as inactive in the database and rename it in the tree
        
        $.getJSON("./"+theService, {request: 'delete', node: nodeId},
          function(msg){
            if (msg.status === "OK") {
              aNode.addClass("deleted");
              aNode = aNode.find("a:first");
              var icn = aNode.children("ins").clone();
              
              // rename generates a callback and we don't want an update in the database
              // data.inst.set_text ( aNode , text ) jsTree.rename(aNode, "(" + aNode.text() + ")");
              var aName = data.inst.get_text(aNode);
              if (aName.charAt(0) != '(') {
                aNode.text("(" + aName + ")").prepend(icn);
              }
              self.getNode(nodeId);
            }
            if (msg.status === "NOK") {
              console.log(msg);
              self.warnUser("The deletion of this item failed.<br>server status: " + msg.status);
            }
            if (msg.status === "NAL") {
              self.warnUser("You are not allowed to delete this item, sorry.");
            }
        });
        e.stopImmediatePropagation();
        return false;
        
      } else {
        $.getJSON("./"+theService, {request: 'delete', node: nodeId},
            function(msg){
              if (msg.status === "NAL") {
                self.warnUser("You are not allowed to delete this item, sorry.");
                $.jstree.rollback(data.rlbk);
        
              } else if (msg.status === "OK") {
                self.warnUser("The item has been deleted.");
                
              } else {
                console.log(msg);
                self.warnUser("The deletion of this item failed.<br>server status: " + msg.status);
                $.jstree.rollback(data.rlbk);
              }
        });
        
      }
        

      
    } else if (data.func === "close_node") {
      //console.log("Tree - close: " + nodeId);
      //console.log(aNode);
      // don't allow closing the root node
      if (nodeId === self.rootId) {
        console.log("Tree - close: not allowed to close root node = " + nodeId);
        e.stopImmediatePropagation();
        return false;
      }

      
    } else if (data.func == "rename_node") {
        //console.log("Tree - Before: rename_node, please-open = " + self.pleaseOpen);
        if (self.pleaseOpen != null) {
          // we're only here after a create_node, set the name and open the item for editing
          $.getJSON("./"+theService, {request: 'rename', name: data.args[1], node: self.pleaseOpen},
              function(msg){
                if (msg.status == "OK") {
                 self.doEdit(self.pleaseOpen);
                 self.pleaseOpen = null;
               }
          });
        }
    }
  })

  
  .bind("delete.jstree", function (e, data) {
    var aNode = data.rslt.obj;
    var nodeId = aNode.attr("id");
    console.log("Tree - Delete: " + nodeId);
    
  })

  
  .bind("rename.jstree", function (e, data) {
    var aNode = data.rslt.obj, text = data.rslt.new_name;
    var nodeId = aNode.attr("id");
    //console.log("Tree - Rename: " + nodeId + " -> " + text);
    
    $.getJSON("./"+theService, {request: 'rename', name: text, node: nodeId},
        function(msg){
          if (msg.status == "NAL") {
            self.warnUser("You are not allowed to rename this item, sorry.");
            $.jstree.rollback(data.rlbk);
    
          } else if (msg.status != "OK") {
            console.log(msg);
            self.warnUser("The rename of this item failed.<br>server status: " + msg.status);
            $.jstree.rollback(data.rlbk);
          }
    });
  })

  
  .bind("move_node.jstree", function (e, data) {
    var aNode = data.rslt.o, refNode = data.rslt.r, type = data.rslt.p;
    var nodeId = aNode.attr("id"), refNodeId = refNode.attr("id");
    //console.log("Tree - Move: " + aNode.text() + " " + type + " " + refNode.text());

    // Allow only one dummy node "website" as toplevel
    if ((refNodeId == "id_0") && ((type == "before") || (type == "after"))) {
      self.warnUser("Can't move this element.");
      $.jstree.rollback(data.rlbk);

    } else {
      // type = "before", "after" or "inside"
      $.getJSON("./"+theService, {request: 'move', refnode: refNodeId, type: type, node: nodeId},
          function(msg) {
            if (msg.status == "NAL") {
              self.warnUser("You are not allowed to move this item, sorry.");
              $.jstree.rollback(data.rlbk);
    
            } else if (msg.status != "OK") {
              console.log(msg);
              self.warnUser("The move of this item failed.<br>server status: " + msg.status);
              $.jstree.rollback(data.rlbk);
            }
      });
    }  
  })

  
  .bind("select_node.jstree", function (e, data) {
    // console.log("Tree - select");
    var nodeId = $(data.args[0]).parent().attr("id");
    if (self.currentNode == nodeId) {
      self.doEdit();
    } else {
      self.currentNode = nodeId;
    }
  })

  
  .bind("deselect_node.jstree", function (e, data) {
    // console.log("Tree - deselect");
    self.currentNode = "";
  })

  
  .bind("create_node.jstree", function(e, data) { console.log(data);
    var title = data.args[2].data[0], aNode = data.rslt.obj;
    var type = data.args[1] || "inside";  // insert type = before, after, inside, first, last
    var refNode = (type == "inside") ? data.args[0] : data.args[1];
    var refNodeId = refNode.attr("id");
    
    $.getJSON("./"+theService, {request: 'insert', refnode: refNodeId, type: type, name: title, kind: self.nextType, extention: 'xxx'},
        function(msg){
          if (msg.status == "NAL") {
            self.warnUser("You are not allowed to create and item here, sorry");
            $.jstree.rollback(data.rlbk);
    
          } else if (msg.status == "NOK") {
            console.log(msg);
            self.warnUser("Creation of a new item failed.<br>server status: " + msg.status);
            $.jstree.rollback(data.rlbk);
    
          } else {
            // remember this node, it will go into "rename" mode now, so after rename -> open it up for editing
            //console.log("create - setting node id to " + msg.node);
            self.pleaseOpen = msg.node;
            aNode.attr("id", msg.node);
            
            self.warnUser("Please choose a name for your item and press the 'enter'-key.");
          }
    });
  })

  
  .jstree({
    plugins : [ "themes", "html_data", "ui", "crrm", "dnd", "types" ],
    core : {
      initially_open : ['id_' + theInitialNode],
      strings: { new_node: "New item" }
    },
    themes : {
      theme: "default"   // alternatives: "apple", "default" or false (= no theme)
    },
    ui: {
      select_limit: 1,
      "initially_select" : ['id_' + theInitialNode] 
    },
    types: {
      "root" : {
        deletable: false,
        renameable: false,
        draggable: false,
        clickable: true
      },
      "image" : {
        valid_children : "none",
        creatable: false,
        icon : { image : theImages + "/extentions/jpg.gif" }
      },
      "file" : {
        valid_children : "none",
        creatable: false,
        icon : { image : theImages + "/extentions/xxx.gif" }
      },
      "folder" : {
        valid_children : [ "file", "image", "folder" ],
        icon : { image : theImages + "/extentions/xxx.gif" }
      }
    }
  });

};


}