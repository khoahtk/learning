/*##############################################################################
#	VNC-Virtual Network Consult AG.
#	Copyright (C) 2004-TODAY VNC-Virtual Network Consult AG.
#	(< http://www.vnc.biz >).
#	This is proprietary software. Please consult VNC sales for licensing.
##############################################################################*/
if (ZmCsfeCommand.clientVersion.substring(0, 3) >= 8.5) {
	biz_zcs_vnc_talk_zimlet.ZIMBRA85 = true;
} else {
	biz_zcs_vnc_talk_zimlet.ZIMBRA85 = false;
}

function biz_zcs_vnc_talk_zimlet_HandlerObject() {
	ZmZimletBase.call(this);
}
var zimletAppName = biz_zcs_vnc_talk_zimlet.ZIMLET_APP_NAME;

biz_zcs_vnc_talk_zimlet_HandlerObject.callInitiator = false;

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype = new ZmZimletBase;

biz_zcs_vnc_talk_zimlet_HandlerObject.constructor = biz_zcs_vnc_talk_zimlet_HandlerObject;

biz_zcs_vnc_talk_zimlet_HandlerObject.BUTTON_APPT_ID = zimletAppName + "_meeting";

biz_zcs_vnc_talk_zimlet_HandlerObject.isInviteMeeting = false;

biz_zcs_vnc_talk_zimlet_HandlerObject.isMailInviteMeeting = false;

biz_zcs_vnc_talk_zimlet_HandlerObject.createRoom = zimletAppName + "CreateRoomMenu";

biz_zcs_vnc_talk_zimlet_HandlerObject.inviteGroupChat = zimletAppName + "InviteToGroupchat";

biz_zcs_vnc_talk_zimlet_HandlerObject.startVideoConference = zimletAppName + "StartVideoconference";

biz_zcs_vnc_talk_zimlet_HandlerObject.inviteUserVideoConference = zimletAppName + "InviteUserToVideoconference";

biz_zcs_vnc_talk_zimlet_HandlerObject.joinVideoConference = zimletAppName + "JoinVideoconference";

biz_zcs_vnc_talk_zimlet_HandlerObject.contactToFavourites = zimletAppName + "AddContactTofavorites";

biz_zcs_vnc_talk_zimlet_HandlerObject.sessionId = "";

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.init = function() {
	this.random = Dwt.getNextId();
	this.jappixCommon = null;
	this.progressDialog = null;
	this.groupTreeSelected = false;
	if (!biz_zcs_vnc_talk_zimlet.ZIMBRA85) {
		AjxPackage.require("vnc.jquery.jquery");
	}
	AjxPackage.require("vnc.json.json-minified");
	AjxPackage.require("vnc.jquery.autocomplete");
	this.loadcssfile("/js/vnc/jquery/jquery.autocomplete.css");
	var MIDDLEWARE_PREFNAME = "firstLogin";
	var responseValue = this.getMiddlewareStoreValue(MIDDLEWARE_PREFNAME);
	this.checkFirstTimeLogin(responseValue,MIDDLEWARE_PREFNAME);
	biz_zcs_vnc_talk_zimlet_HandlerObject.readGlobalParameters();
	biz_zcs_vnc_talk_zimlet_HandlerObject.unloadDocument();
  biz_zcs_vnc_talk_zimlet_this = this;
	this.launchMiddleWareLib();
	/*
	biz_zcs_vnc_talk_zimlet_HandlerObject._vncChatApp = this.createApp(
		this.getMessage("vnc_video_talk"),
		"zimbra",
		this.getMessage("vnc_video_talk")
	);
	//htk
	/*
	 * Softphone does not work right away.
	 * biz_zcs_vnc_talk_zimlet_HandlerObject._vncSoftPhoneApp = this.createApp(
	 *     this.getMessage("vnc_soft_phone"),
	 *     "zimbra",
	 *     this.getMessage("vnc_soft_phone")
	 * );
	*/
	document.getElementById("logOff").addEventListener("click",function(){
		JappixMini.disconnect()
	});
    response = AjxRpc.invoke("", "/service/zimlet/biz_zcs_vnc_talk_zimlet/op.jsp?op=get");
    if(response.success == true){
        responseJson = JSON.parse(response.text);
        if(responseJson == null)
            chatFlag = true;
        else
            chatFlag = AjxStringUtil.trim(responseJson.flag);
        if(chatFlag == "false"){
            console.log("false--------------------------->");
            if(typeof JappixMini != "undefined"){
              setTimeout(function(){JappixMini.disconnect()},1000);
            }
        }
    }
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.onAction = function(id, action, currentViewId, lastViewId)
{
	if((action == "Save" && lastViewId=="PREF") || (action == "Save" && currentViewId=="PREF") || (action == "Speichern" && lastViewId=="PREF") || (action == "Speichern" && currentViewId=="PREF")){
		//console.log("Save TimeZone", AjxTimezone.getShortName(appCtxt.get(ZmSetting.DEFAULT_TIMEZONE)));
		var r = AjxTimezone.getRule(appCtxt.get(ZmSetting.DEFAULT_TIMEZONE));
		var offset = r.standard.offset;
		var sign = offset < 0 ? "-" : "+";
		var stdOffset = Math.abs(offset);
 		var hours = Math.floor(stdOffset / 60);
 		var minutes = stdOffset % 60;
 		hours = hours < 10 ? '0' + hours : hours;
 		minutes = minutes < 10 ? '0' + minutes : minutes;
		var time_zone = ["GMT",sign,hours,true?":":"",minutes].join("");
		JappixMini.updateTimeZone(time_zone);
	}
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.getMiddlewareStoreValue = function(prefName) {
	var URL = "/VNCMiddleware/rest";
	var appName="vnctalk";
	var contentType = { 'Content-Type': 'application/json' };
	var response = AjxRpc.invoke(JSON.stringify({"UserName":appCtxt.getActiveAccount().getEmail(),"Password":""}),URL+"/account/login", contentType, null, false);
	var jsonResponse = JSON.parse(response.text);
	biz_zcs_vnc_talk_zimlet_HandlerObject.sessionId = "";
	if(jsonResponse.status==200){
		biz_zcs_vnc_talk_zimlet_HandlerObject.sessionId = jsonResponse.result.SessionId;
	}
	var res = AjxRpc.invoke(null,URL+"/appPrefs/effective/?appName="+appName+"&prefName="+prefName, {"X-VNC-Auth":biz_zcs_vnc_talk_zimlet_HandlerObject.sessionId}, null, true);
	var responseValue = "";
	if (res.success == true) {
		responseValue = AjxStringUtil.trim(res.text);
	}else{
		window.alert("Your middleware can not be installed/configured properly");
	}
	return responseValue;
}
biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.checkFirstTimeLogin = function(responseValue,prefName) {
		this.firstTimeLogin = 0;
		if(responseValue==""){
			biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.putSettingMiddleware(biz_zcs_vnc_talk_zimlet_HandlerObject.sessionId,prefName,"1");
			this.firstTimeLogin = 0;
		}else{
			this.firstTimeLogin = 1;
		}
}

biz_zcs_vnc_talk_zimlet_HandlerObject.getFirstTimeLogin = function() {
	return biz_zcs_vnc_talk_zimlet_this.firstTimeLogin
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.contextMenu = function() {
	var list=[];
	list.push(biz_zcs_vnc_talk_zimlet_HandlerObject.createRoom);
	list.push(biz_zcs_vnc_talk_zimlet_HandlerObject.inviteGroupChat);
	list.push(biz_zcs_vnc_talk_zimlet_HandlerObject.startVideoConference);
	list.push(biz_zcs_vnc_talk_zimlet_HandlerObject.inviteUserVideoConference);
	list.push(biz_zcs_vnc_talk_zimlet_HandlerObject.joinVideoConference);
	//list.push(biz_zcs_vnc_talk_zimlet_HandlerObject.contactToFavourites);
	var overrides = {};

	var op = list[0];
	overrides[op] = {};
	overrides[op].id = biz_zcs_vnc_talk_zimlet_HandlerObject.createRoom;
	overrides[op].text = biz_zcs_vnc_talk_zimlet.vnc_talk_context_create_room;
	overrides[op].image = "NewAppointment";
	overrides[op].tooltip = biz_zcs_vnc_talk_zimlet.vnc_talk_context_create_room;

	var op = list[1];
	overrides[op] = {};
	overrides[op].id = biz_zcs_vnc_talk_zimlet_HandlerObject.inviteGroupChat;
	overrides[op].text = biz_zcs_vnc_talk_zimlet.vnc_talk_context_invitetogroupchat;
	overrides[op].image = "NewMessage";
	overrides[op].tooltip =biz_zcs_vnc_talk_zimlet.vnc_talk_context_invitetogroupchat;


	var op = list[2];
	overrides[op] = {};
	overrides[op].id = biz_zcs_vnc_talk_zimlet_HandlerObject.startVideoConference;
	overrides[op].text = biz_zcs_vnc_talk_zimlet.vnc_talk_context_start_video_conference;
	overrides[op].image = "NewTask";
	overrides[op].tooltip = biz_zcs_vnc_talk_zimlet.vnc_talk_context_start_video_conference;


	var op = list[3];
	overrides[op] = {};
	overrides[op].id = biz_zcs_vnc_talk_zimlet_HandlerObject.inviteUserVideoConference;
	overrides[op].text = biz_zcs_vnc_talk_zimlet.vnc_talk_context_start_video_invite_user;
	overrides[op].image = "NewGroup";
	overrides[op].tooltip = biz_zcs_vnc_talk_zimlet.vnc_talk_context_start_video_invite_user;


	var op = list[4];
	overrides[op] = {};
	overrides[op].id = biz_zcs_vnc_talk_zimlet_HandlerObject.joinVideoConference;
	overrides[op].text = biz_zcs_vnc_talk_zimlet.vnc_talk_context_join_video_conference;
	overrides[op].image = "NewContact";
	overrides[op].tooltip = biz_zcs_vnc_talk_zimlet.vnc_talk_context_join_video_conference;


	/*var op = list[5];
	overrides[op] = {};
	overrides[op].id = biz_zcs_vnc_talk_zimlet_HandlerObject.contactToFavourites;
	overrides[op].text = biz_zcs_vnc_talk_zimlet.vnc_talk_context_add_contact_favourite;
	overrides[op].image = "NewGroup";
	overrides[op].tooltip = biz_zcs_vnc_talk_zimlet.vnc_talk_context_add_contact_favourite;*/

	this._participantActionMenus = new ZmActionMenu({parent:appCtxt.getShell(),menuItems:list,overrides:overrides ,controller:appCtxt.getCurrentController(), context:appCtxt.getCurrentView()});

	for (var i = 0; i < list.length; i++) {
		var op = list[i];
		var mi = this._participantActionMenus.getOp(op);
		if (!mi) { continue; }
		if (op == ZmOperation.FORMAT_HTML) {
			mi.setData(ZmHtmlEditor._VALUE, DwtHtmlEditor.HTML);
		} else if (op == ZmOperation.FORMAT_TEXT) {
			mi.setData(ZmHtmlEditor._VALUE, DwtHtmlEditor.TEXT);
		}
		mi.setData(ZmOperation.KEY_ID, op);
	}
		this._participantActionMenus.addSelectionListener(biz_zcs_vnc_talk_zimlet_HandlerObject.createRoom, new AjxListener(this,this._createRoomContextMenu));
		this._participantActionMenus.addSelectionListener(biz_zcs_vnc_talk_zimlet_HandlerObject.inviteGroupChat, new AjxListener(this,this._groupChatContextMenu));
		this._participantActionMenus.addSelectionListener(biz_zcs_vnc_talk_zimlet_HandlerObject.startVideoConference, new AjxListener(this,this._startVideoContextMenu));
		this._participantActionMenus.addSelectionListener(biz_zcs_vnc_talk_zimlet_HandlerObject.inviteUserVideoConference, new AjxListener(this,this._inviteUserContextMenu));
		this._participantActionMenus.addSelectionListener(biz_zcs_vnc_talk_zimlet_HandlerObject.joinVideoConference, new AjxListener(this,this._joinVideoContextMenu));
		//this._participantActionMenus.addSelectionListener(biz_zcs_vnc_talk_zimlet_HandlerObject.contactToFavourites, new AjxListener(this,this._contactFavouriteContextMenu));
};

/* Create Room Context Menu Handler */
biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._createRoomContextMenu = function(){
	createRoomFromLeftSidePanel(handleCreateRoomFromLeftSidePanel);
};

/* Group Chat Context Menu Handler */
biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._groupChatContextMenu = function(){
	inviteToGroupchatFromLeftSidePanel(handleInviteToGroupchatFromLeftSidePanel);
};

/* Start Video Conference Context Menu Handler */
biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._startVideoContextMenu = function(){
	startVideoconferenceFromLeftSidePanel(handleStartVideoconferenceFromLeftSidePanel);
};

/* Invite User to Video Conference Context Menu Handler */
biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._inviteUserContextMenu = function(){
	inviteToVideoconferenceFromLeftSidePanel(handleInviteToVideoconferenceFromLeftSidePanel);
};

/*Join Videoconference Context Menu Handler */
biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._joinVideoContextMenu = function(){
	joinVideoconferenceFromLeftSidePanel(handleJoinVideoconferenceFromLeftSidePanel)
};

/* Add Contact to favorites Context Menu Handler */
biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._contactFavouriteContextMenu = function(){
  if (!this.addFavoriteDialog) {
    random = Dwt.getNextId();
    var dataArray = {
      random: random
    };
    parentView = new DwtComposite(this.getShell());
    parentView.setSize("270", "75");
    parentView.getHtmlElement().innerHTML = AjxTemplate.expand("biz_zcs_vnc_talk_zimlet.templates.biz_zcs_vnc_talk_zimlet_favorite_people#biz_zcs_vnc_talk_favorite_people", dataArray);
    this.addFavoriteDialog = new ZmDialog({
      title: "Add contact to Favorites",
      view: parentView,
      parent: this.getShell(),
      standardButtons: [DwtDialog.OK_BUTTON, DwtDialog.DISMISS_BUTTON]
    });
    this.addFavoriteDialog.getButton(DwtDialog.DISMISS_BUTTON).setText(this.getMessage("vnc_talk_close"));
    this.addFavoriteDialog.setButtonListener(
      DwtDialog.OK_BUTTON,
      new AjxListener(
        this,
        addContactToFavoriteFromLeftSidePanel
      )
    );
    this.emailInput = new DwtInputField({
      parent: this.addFavoriteDialog,
      id: "input_favorite_people" + random,
      inputId:"input_favorite_people_talk"
    });
    this.emailInput.setSize("22","22");
    this._handleKeyUpEvent();
    this.emailInput.setValue("");
    document.getElementById("vnc_talk_favorite_people_email" + random).appendChild(
      this.emailInput.getHtmlElement()
    );
    this.addFavoriteDialog._baseTabGroupSize = 3;
    this.addFavoriteDialog._tabGroup.addMember(
      this.emailInput,
      0
    );
    this.addFavoriteDialog._tabGroup.addMember(
      this.addFavoriteDialog.getButton(
        DwtDialog.OK_BUTTON
      ),
      1
    );
    this.addFavoriteDialog._tabGroup.addMember(
      this.addFavoriteDialog.getButton(
        DwtDialog.DISMISS_BUTTON
      ),
      2
    );
  }else{
    this._handleKeyUpEvent();
    this.emailInput.setValue("");
  }

  //close autocomplete when drag dialog
  var dragId1 = '#'+this.addFavoriteDialog._dragHandleId.trim();
  $(dragId1).mousedown(function(){
    $("#input_favorite_people_talk").autocomplete("close");
  });
  JappixMini.getFavoriteContacts(function(res){
      var list = res["vnc::biz::vnctalk::user::favorite_users"] || "[]";
      var arr_favorite = JSON.parse(list);
      console.log("Current favorite-list:", arr_favorite);
      biz_zcs_vnc_talk_zimlet_this._handleAddFavorite(arr_favorite);
      biz_zcs_vnc_talk_zimlet_this.addFavoriteDialog.popup();
  });
};

initializeToolbar = function(app, toolbar, controller, viewId) {
	var viewType = appCtxt.getViewTypeFromId(viewId);
	if (viewType == ZmId.VIEW_APPOINTMENT) {
		this._initCalendarVNCTalkToolbar(toolbar, controller);
	}
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._initCalendarVNCTalkToolbar = function(toolbar,controller){
	var buttonIndex = toolbar.opList.length + 1;
	var buttonArgs = {
		text : zimletAppName + " meeting",
		tooltip : zimletAppName + " meeting",
		index : buttonIndex,
		image : ""
	};
	var button = toolbar.createOp(biz_zcs_vnc_talk_zimlet_HandlerObject.BUTTON_APPT_ID, buttonArgs);
	button.addSelectionListener(new AjxListener(this,this._handlecalendartoolBtnClick,controller));
	button.setVisibility(false);
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.doDrop = function(droppedItem){
	if(droppedItem instanceof Array) {
		var msg =  appCtxt.getMsgDialog();
		msg.setMessage(this.getMessage("vnc_talk_mail_array_error"),DwtMessageDialog.WARNING_STYLE);
		msg.popup();
		return;
	}else{
		var obj = droppedItem.srcObj ? droppedItem.srcObj : droppedItem;
		if(!obj._loaded){
			this._loadItem(obj,droppedItem);
			return;
		}
		if (obj.type == "CONV"){
			this._getMessageFromConv(obj);
		} else if(obj.type == "MSG") {
			this._getMessageFromMsg(obj);
		}
	}
	this.mailConferenceSettingDialog();
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.mailConferenceSettingDialog = function(){
	var meetingDate = new Date();
	if(meetingDate.getMinutes()>0){
		meetingDate.setMinutes(0);
	}
	if(this.mailConferenceDialog){
		this.mailvncMeetingRoom.setValue(this.mailMsgSubject);
		var dateFormate = AjxDateFormat.getTimeInstance(AjxDateFormat.SHORT);
		document.getElementById("vnctalkmailmeeting_date_field_"+this.random).value = AjxDateUtil.simpleComputeDateStr(meetingDate);
		this.mailstartMeetingTime.getInputField().setValue(dateFormate.format(meetingDate));
		meetingDate.setHours(meetingDate.getHours()+1);
		document.getElementById("vnctalkmailmeeting_end_date_field_"+this.random).value = AjxDateUtil.simpleComputeDateStr(meetingDate);
		this.mailendMeetingTime.getInputField().setValue(dateFormate.format(meetingDate));
		this.mailConferenceDialog.popup();
		return;
	}
	this.mailView = new DwtComposite(appCtxt.getShell());
	this.mailView.setSize("400px", "150px");
	var dataArray = {
		random:this.random,
		room:this.getMessage("meetingroomname"),
		startdate:this.getMessage("meetingstartdate"),
		enddate:this.getMessage("meetingenddate")
	};
	this.mailView.getHtmlElement().innerHTML = AjxTemplate.expand("biz_zcs_vnc_talk_zimlet.templates.vnctalkmailmeeting_template#VNCtalkMailMeetingDialog", dataArray);
	this.mailConferenceDialog = new ZmDialog({
		title: this.getMessage("vnc_talk_meeting_dialog_title"),
		view: this.mailView,
		parent: this.getShell(),
		standardButtons: [DwtDialog.OK_BUTTON, DwtDialog.DISMISS_BUTTON]
	});
	this.mailConferenceDialog.getButton(DwtDialog.DISMISS_BUTTON).setText(this.getMessage("vnc_talk_close"));
	this.mailConferenceDialog.setButtonListener(
		DwtDialog.OK_BUTTON,
		new AjxListener(
			this,
			this._mailMeetingOkListener
		)
	);

	var mailstartDateListener = new AjxListener(this,this.mailstartDateListener);
	var mailstartDateSelection = new AjxListener(this, this.mailstartDateSelection);
	this.mailstartDate= ZmCalendarApp.createMiniCalButton(this.mailView, "vnctalkmailmeeting_date_"+this.random,mailstartDateListener,mailstartDateSelection);
	if(biz_zcs_vnc_talk_zimlet.ZIMBRA85){
		this.mailstartMeetingTime=new DwtTimeInput(this.mailView,DwtTimeInput.START);
	}else{
		this.mailstartMeetingTime=new ZmTimeInput(this.mailView,ZmTimeInput.START);
	}
	this.mailstartMeetingTime.getInputField().setReadOnly(true);

	var mailendDateListener = new AjxListener(this,this.mailendDateListener);
	var mailendDateSelection = new AjxListener(this, this.mailendDateSelection);
	this.mailendDate= ZmCalendarApp.createMiniCalButton(this.mailView, "vnctalkmailmeeting_end_date_"+this.random,mailendDateListener,mailendDateSelection);
	if(biz_zcs_vnc_talk_zimlet.ZIMBRA85){
		this.mailendMeetingTime=new DwtTimeInput(this.mailView,DwtTimeInput.END);
	}else{
		this.mailendMeetingTime=new ZmTimeInput(this.mailView,ZmTimeInput.END);
	}
	this.mailendMeetingTime.getInputField().setReadOnly(true);

	this.mailvncMeetingRoom = new DwtInputField({
		parent: this.mailConferenceDialog,
		type: DwtInputField.STRING,
		size: "30",
		inputId: "vncmailmeetingroomid"
	});
	document.getElementById("vnctalk_mailmeeting_room_"+this.random).appendChild(this.mailvncMeetingRoom.getHtmlElement());
	document.getElementById("vnctalkmailmeeting_date_"+this.random).appendChild(this.mailstartDate.getHtmlElement());
	document.getElementById("vnctalkmailmeeting_time_"+this.random).appendChild(this.mailstartMeetingTime.getHtmlElement());

	document.getElementById("vnctalkmailmeeting_end_date_"+this.random).appendChild(this.mailendDate.getHtmlElement());
	document.getElementById("vnctalkmailmeeting_end_time_"+this.random).appendChild(this.mailendMeetingTime.getHtmlElement());
	this.mailvncMeetingRoom.setValue(this.mailMsgSubject);
	document.getElementById("vnctalkmailmeeting_date_field_"+this.random).value = AjxDateUtil.simpleComputeDateStr(meetingDate);
	var timeFormate = AjxDateFormat.getTimeInstance(AjxDateFormat.SHORT);
	this.mailstartMeetingTime.getInputField().setValue(timeFormate.format(meetingDate));

	meetingDate.setHours(meetingDate.getHours()+1);
	document.getElementById("vnctalkmailmeeting_end_date_field_"+this.random).value = AjxDateUtil.simpleComputeDateStr(meetingDate);
	this.mailendMeetingTime.getInputField().setValue(timeFormate.format(meetingDate));

	this.mailConferenceDialog.popup();
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.mailstartDateSelection = function(ev){
	document.getElementById("vnctalkmailmeeting_date_field_"+this.random).value = AjxDateUtil.simpleComputeDateStr(ev.detail);
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.mailstartDateListener = function(ev){
	var calDate = AjxDateUtil.simpleParseDateStr(document.getElementById("vnctalkmailmeeting_date_field_"+this.random).value);
	var menu = ev.item.getMenu();
	var cal = menu.getItem(0);
	cal.setDate(calDate, true);
	ev.item.popup();
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.mailstartDateSelection =function(ev){
	document.getElementById("vnctalkmailmeeting_date_field_"+this.random).value = AjxDateUtil.simpleComputeDateStr(ev.detail);
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.mailendDateSelection = function(ev){
	document.getElementById("vnctalkmailmeeting_end_date_field_"+this.random).value = AjxDateUtil.simpleComputeDateStr(ev.detail);
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.mailendDateListener = function(ev){
	var calDate = AjxDateUtil.simpleParseDateStr(document.getElementById("vnctalkmailmeeting_end_date_field_"+this.random).value);
	var menu = ev.item.getMenu();
	var cal = menu.getItem(0);
	cal.setDate(calDate, true);
	ev.item.popup();
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.mailendDateSelection =function(ev){
	document.getElementById("vnctalkmailmeeting_end_date_field_"+this.random).value = AjxDateUtil.simpleComputeDateStr(ev.detail);
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._loadItem = function(obj,droppedItem){
	var callback = new AjxCallback(this, this.doDrop,[droppedItem]);
	if (obj.type == "CONV" ) {
		obj.loadMsgs({fetchAll:true},callback);
	} else if (obj.type == "MSG") {
		obj.load({forceLoad:true,callback:callback});
	}
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._getMessageFromConv = function(convSrcObj){
	var msg = convSrcObj.getFirstHotMsg();
	this.mailMsgSubject = msg.subject;
	this.mailParticipant = this.getMailParticipant(msg.participants._array);
};
biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._getMessageFromMsg = function(convSrcObj){
	var msg = convSrcObj;
	this.mailMsgSubject = msg.subject;
	this.mailParticipant = this.getMailParticipant(msg.participants._array);
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.getMailParticipant = function(participant){
	this.mailAddress = [];
	for(var i =0; i < participant.length; i++) {
		if(participant[i].address!=appCtxt.getActiveAccount().getEmail()){
			this.mailAddress.push(participant[i].address);
		}
	}
	return this.mailAddress;
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._handlecalendartoolBtnClick = function(){
	var meetingDate = new Date();
	if(meetingDate.getMinutes()>0){
		meetingDate.setMinutes(0);
	}
	if(this.pbDialog){
		this.vncMeetingRoom.setValue("");
		document.getElementById("vnctalkmeeting_date_field_"+this.random).value = AjxDateUtil.simpleComputeDateStr(meetingDate);
		var dateFormate = AjxDateFormat.getTimeInstance(AjxDateFormat.SHORT);
		this.startMeetingTime.getInputField().setValue(dateFormate.format(meetingDate));
		meetingDate.setHours(meetingDate.getHours()+1);
		document.getElementById("vnctalkmeeting_end_date_field_"+this.random).value = AjxDateUtil.simpleComputeDateStr(meetingDate)
		this.endMeetingTime.getInputField().setValue(dateFormate.format(meetingDate));
		this.pbDialog.popup();
		return;
	}
	this.pView = new DwtComposite(appCtxt.getShell());
	this.pView.setSize("400px", "150px");
	var dataArray = {
		random:this.random,
		room:this.getMessage("meetingroomname"),
		startdate:this.getMessage("meetingstartdate"),
		enddate:this.getMessage("meetingenddate")
	};
	this.pView.getHtmlElement().innerHTML = AjxTemplate.expand("biz_zcs_vnc_talk_zimlet.templates.vnctalkmeeting_template#VNCtalkMeetingDialog", dataArray);
	this.pbDialog = new ZmDialog({
		title: this.getMessage("vnc_talk_meeting_dialog_title"),
		view: this.pView,
		parent: this.getShell(),
		standardButtons: [DwtDialog.OK_BUTTON, DwtDialog.DISMISS_BUTTON]
	});
	this.pbDialog.getButton(DwtDialog.DISMISS_BUTTON).setText(this.getMessage("vnc_talk_close"));
	this.pbDialog.setButtonListener(
		DwtDialog.OK_BUTTON,
		new AjxListener(
			this,
			this._meetingOkListener
		)
	);

	var startDateListener = new AjxListener(this,this.startDateListener);
	var startDateSelection = new AjxListener(this, this.startDateSelection);
	this.startDate= ZmCalendarApp.createMiniCalButton(this.pView, "vnctalkmeeting_date_"+this.random,startDateListener,startDateSelection);
	if(biz_zcs_vnc_talk_zimlet.ZIMBRA85){
		this.startMeetingTime=new DwtTimeInput(this.pView,DwtTimeInput.START);
	}else{
		this.startMeetingTime=new ZmTimeInput(this.pView,ZmTimeInput.START);
	}
	this.startMeetingTime.getInputField().setReadOnly(true);

	var endDateListener = new AjxListener(this,this.endDateListener);
	var endDateSelection = new AjxListener(this, this.endDateSelection);
	this.endDate= ZmCalendarApp.createMiniCalButton(this.pView, "vnctalkmeeting_end_date_"+this.random,endDateListener,endDateSelection);
	if(biz_zcs_vnc_talk_zimlet.ZIMBRA85){
		this.endMeetingTime=new DwtTimeInput(this.pView,DwtTimeInput.END);
	}else{
		this.endMeetingTime=new ZmTimeInput(this.pView,ZmTimeInput.END);
	}
	this.endMeetingTime.getInputField().setReadOnly(true);

	this.vncMeetingRoom = new DwtInputField({
		parent: this.pbDialog,
		type: DwtInputField.STRING,
		size: "30",
		inputId: "vncmeetingroomid"
	});
	document.getElementById("vnctalk_meeting_room_"+this.random).appendChild(this.vncMeetingRoom.getHtmlElement());
	document.getElementById("vnctalkmeeting_date_"+this.random).appendChild(this.startDate.getHtmlElement());
	document.getElementById("vnctalkmeeting_time_"+this.random).appendChild(this.startMeetingTime.getHtmlElement());

	document.getElementById("vnctalkmeeting_end_date_"+this.random).appendChild(this.endDate.getHtmlElement());
	document.getElementById("vnctalkmeeting_end_time_"+this.random).appendChild(this.endMeetingTime.getHtmlElement());
	document.getElementById("vnctalkmeeting_date_field_"+this.random).value = AjxDateUtil.simpleComputeDateStr(meetingDate);
	var dateFormate = AjxDateFormat.getTimeInstance(AjxDateFormat.SHORT);
	this.startMeetingTime.getInputField().setValue(dateFormate.format(meetingDate));
	meetingDate.setHours(meetingDate.getHours()+1);
	document.getElementById("vnctalkmeeting_end_date_field_"+this.random).value = AjxDateUtil.simpleComputeDateStr(meetingDate);
	this.endMeetingTime.getInputField().setValue(dateFormate.format(meetingDate));

	this.pbDialog.popup();
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.endDateSelection = function(ev){
	document.getElementById("vnctalkmeeting_end_date_field_"+this.random).value = AjxDateUtil.simpleComputeDateStr(ev.detail);
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.endDateListener = function(ev){
	var calDate = AjxDateUtil.simpleParseDateStr(document.getElementById("vnctalkmeeting_end_date_field_"+this.random).value);
	var menu = ev.item.getMenu();
	var cal = menu.getItem(0);
	cal.setDate(calDate, true);
	ev.item.popup();
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.endDateSelection =function(ev){
	document.getElementById("vnctalkmeeting_end_date_field_"+this.random).value = AjxDateUtil.simpleComputeDateStr(ev.detail);
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._mailMeetingOkListener = function(){
	var MiddlewareURL = "/VNCMiddleware";
	if(biz_zcs_vnc_talk_zimlet_HandlerObject.GLOBAL_MIDDLEWARE_URL!=null){
		MiddlewareURL = biz_zcs_vnc_talk_zimlet_HandlerObject.GLOBAL_MIDDLEWARE_URL;
	}
	this.mailmeetingStartDate = AjxDateUtil.simpleParseDateStr(document.getElementById("vnctalkmailmeeting_date_field_"+this.random).value);
	this.mailmeetingStartDate.setHours(this.mailstartMeetingTime.getHours());
	this.mailmeetingStartDate.setMinutes(this.mailstartMeetingTime.getMinutes());

	this.mailmeetingEndDate = AjxDateUtil.simpleParseDateStr(document.getElementById("vnctalkmailmeeting_end_date_field_"+this.random).value);
	this.mailmeetingEndDate.setHours(this.mailendMeetingTime.getHours());
	this.mailmeetingEndDate.setMinutes(this.mailendMeetingTime.getMinutes());

	var timeStart = new Date(this.mailmeetingStartDate).getTime();
	var timeEnd = new Date(this.mailmeetingEndDate).getTime();
	var hourDiff = timeEnd - timeStart;
	var hDiff = hourDiff / 3600 / 1000;
	var hours = Math.floor(hDiff);
	var days = Math.floor(hourDiff/(1000*60*60*24));
	if(hours<0){
		var msg =  appCtxt.getMsgDialog();
		msg.setMessage(this.getMessage("vnc_talk_end_date_greater"),DwtMessageDialog.WARNING_STYLE);
		msg.popup();
		return;
	}else if(hours<2){
		var msg =  appCtxt.getMsgDialog();
		msg.setMessage(this.getMessage("vnc_talk_end_date_two_hour"),DwtMessageDialog.WARNING_STYLE);
		msg.popup();
		return;
	}
	if(days>7){
		var msg =  appCtxt.getMsgDialog();
		msg.setMessage(this.getMessage("vnc_talk_duration_week_error"),DwtMessageDialog.WARNING_STYLE);
		msg.popup();
		return;
	}
	if(this.mailvncMeetingRoom.getValue()==""){
		this.mailvncMeetingRoomName = this.randomRoomGenerate();
	}else{
		this.mailvncMeetingRoomName = this.mailvncMeetingRoom.getValue();
	}
	var contentType = { 'Content-Type': 'application/json' };
	var response = AjxRpc.invoke(null,MiddlewareURL+"/rest/vnctalk/jicofo/conference?"+"name="+this.mailvncMeetingRoomName+"&start_time="+this.mailmeetingStartDate.toJSON()+"&mail_owner="+appCtxt.getActiveAccount().getEmail()+"", contentType, null, false);
	if(response.success==true){
		this.mailConferenceDialog.popdown();
		biz_zcs_vnc_talk_zimlet_HandlerObject.isMailInviteMeeting = true;
		var r = appCtxt.getApp(biz_zcs_vnc_talk_zimlet_HandlerObject._vncChatApp);
		r.activate(true);
		appCtxt.getAppViewMgr().setView(appCtxt.getApp(biz_zcs_vnc_talk_zimlet_HandlerObject._vncChatApp)._name,true);
	}else{
		if(response.status==401 || response.status==500 || response.status==404){
			var msg =  appCtxt.getMsgDialog();
			msg.setMessage(this.getMessage("vnc_talk_middleware_error"),DwtMessageDialog.WARNING_STYLE);
			msg.popup();
			return;
		}
		if(response.status==409){
			var jsonParseData = JSON.parse(response.text);
			var conflictID = jsonParseData.conflict_id;
			biz_zcs_vnc_talk_zimlet_HandlerObject.res = response;
			var contentType = { 'Content-Type': 'application/json' };
			var response = AjxRpc.invoke(null,MiddlewareURL+"/rest/vnctalk/jicofo/conference/"+conflictID, contentType, null, true);
			if(response.success==true){
				var jsonResponseMeeting = JSON.parse(response.text);
				this.mailvncMeetingRoomName = jsonResponseMeeting.name;
				this.mailConferenceDialog.popdown();
				biz_zcs_vnc_talk_zimlet_HandlerObject.isMailInviteMeeting = true;
				var r = appCtxt.getApp(biz_zcs_vnc_talk_zimlet_HandlerObject._vncChatApp);
				r.activate(true);
				appCtxt.getAppViewMgr().setView(appCtxt.getApp(biz_zcs_vnc_talk_zimlet_HandlerObject._vncChatApp)._name,true);
			}
		}
	}
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._meetingOkListener = function(){
	var MiddlewareURL = "/VNCMiddleware";
	if(biz_zcs_vnc_talk_zimlet_HandlerObject.GLOBAL_MIDDLEWARE_URL!=null){
		MiddlewareURL = biz_zcs_vnc_talk_zimlet_HandlerObject.GLOBAL_MIDDLEWARE_URL;
	}
	this.meetingStartDate = AjxDateUtil.simpleParseDateStr(document.getElementById("vnctalkmeeting_date_field_"+this.random).value);
	this.meetingStartDate.setHours(this.startMeetingTime.getHours());
	this.meetingStartDate.setMinutes(this.startMeetingTime.getMinutes());

	this.meetingEndDate = AjxDateUtil.simpleParseDateStr(document.getElementById("vnctalkmeeting_end_date_field_"+this.random).value);
	this.meetingEndDate.setHours(this.endMeetingTime.getHours());
	this.meetingEndDate.setMinutes(this.endMeetingTime.getMinutes());

	var timeStart = new Date(this.meetingStartDate).getTime();
	var timeEnd = new Date(this.meetingEndDate).getTime();
	var hourDiff = timeEnd - timeStart;
	var hDiff = hourDiff / 3600 / 1000;
	var hours = Math.floor(hDiff);
	var days = Math.floor(hourDiff/(1000*60*60*24));
	if(hours<0){
		var msg =  appCtxt.getMsgDialog();
		msg.setMessage(this.getMessage("vnc_talk_end_date_greater"),DwtMessageDialog.WARNING_STYLE);
		msg.popup();
		return;
	}else if(hours<2){
		var msg =  appCtxt.getMsgDialog();
		msg.setMessage(this.getMessage("vnc_talk_end_date_two_hour"),DwtMessageDialog.WARNING_STYLE);
		msg.popup();
		return;
	}else if(days>7){
		var msg =  appCtxt.getMsgDialog();
		msg.setMessage(this.getMessage("vnc_talk_duration_week_error"),DwtMessageDialog.WARNING_STYLE);
		msg.popup();
		return false;
	}
	if(this.vncMeetingRoom.getValue()==""){
		this.vncMeetingRoomName = this.randomRoomGenerate();
	}else{
		this.vncMeetingRoomName = this.vncMeetingRoom.getValue();
	}
	var contentType = { 'Content-Type': 'application/json' };
	var response = AjxRpc.invoke(null,MiddlewareURL+"/rest/vnctalk/jicofo/conference?"+"name="+this.vncMeetingRoomName+"&start_time="+this.meetingStartDate.toJSON()+"&mail_owner="+appCtxt.getActiveAccount().getEmail()+"", contentType, null, false);
	if(response.success==true){
		this.pbDialog.popdown();
		biz_zcs_vnc_talk_zimlet_HandlerObject.isInviteMeeting = true;
		var r = appCtxt.getApp(biz_zcs_vnc_talk_zimlet_HandlerObject._vncChatApp);
		r.activate(true);
		appCtxt.getAppViewMgr().setView(appCtxt.getApp(biz_zcs_vnc_talk_zimlet_HandlerObject._vncChatApp)._name,true);
	}else{
		if(response.status==401 || response.status==500 || response.status==404){
			var msg =  appCtxt.getMsgDialog();
			msg.setMessage(this.getMessage("vnc_talk_middleware_error"),DwtMessageDialog.WARNING_STYLE);
			msg.popup();
			return;
		}
		if(response.status==409){
			var jsonParseData = JSON.parse(response.text);
			var conflictID = jsonParseData.conflict_id;
			biz_zcs_vnc_talk_zimlet_HandlerObject.res = response;
			var contentType = { 'Content-Type': 'application/json' };
			var response = AjxRpc.invoke(null,MiddlewareURL+"/rest/vnctalk/jicofo/conference/"+conflictID, contentType, null, true);
			if(response.success==true){
				var jsonResponseMeeting = JSON.parse(response.text);
				this.vncMeetingRoomName = jsonResponseMeeting.name;
				this.pbDialog.popdown();
				biz_zcs_vnc_talk_zimlet_HandlerObject.isInviteMeeting = true;
				var r = appCtxt.getApp(biz_zcs_vnc_talk_zimlet_HandlerObject._vncChatApp);
				r.activate(true);
				appCtxt.getAppViewMgr().setView(appCtxt.getApp(biz_zcs_vnc_talk_zimlet_HandlerObject._vncChatApp)._name,true);
			}
		}
	}
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.randomRoomGenerate = function(){
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for( var i=0; i < 32; i++ ){
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.startDateSelection = function(ev){
	document.getElementById("vnctalkmeeting_date_field_"+this.random).value = AjxDateUtil.simpleComputeDateStr(ev.detail);
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.startDateListener = function(ev){
	var calDate = AjxDateUtil.simpleParseDateStr(document.getElementById("vnctalkmeeting_date_field_"+this.random).value);
	var menu = ev.item.getMenu();
	var cal = menu.getItem(0);
	cal.setDate(calDate, true);
	ev.item.popup();
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.startDateSelection =function(ev){
	document.getElementById("vnctalkmeeting_date_field_"+this.random).value = AjxDateUtil.simpleComputeDateStr(ev.detail);
};


biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.loadcssfile = function(filename) {
	var fileref = document.createElement("link");
	fileref.setAttribute("rel", "stylesheet");
	fileref.setAttribute("type", "text/css");
	fileref.setAttribute("href", filename);
	if (typeof fileref!="undefined")
		document.getElementsByTagName("head")[0].appendChild(fileref);
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._progressBar = function() {
        if (this.progressDialog) {
                this.progressDialog.popup();
        } else {
                this.progressDialog  = appCtxt.getMsgDialog();
                this.progressDialog.getHtmlElement().innerHTML = "<img src='" + biz_zcs_vnc_talk_zimlet_this.getResource("progress.gif") + "'></img>";
                this.progressDialog.popup();
        }
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.removeHoverFromButton = function(item){
	jQuery(item.getHtmlElement()).removeClass('ZHover');
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.appActive = function(appName, active) {
	var actionMenu  = appCtxt.getAppController()._newButton;
	if(appName == biz_zcs_vnc_talk_zimlet_HandlerObject._vncChatApp && active == true){
		this.contextMenu();
		actionMenu.addListener(DwtEvent.ONCLICK, new AjxListener(this, this.tabNewChatRoomListener));
		//actionMenu.addListener(DwtEvent.ONMOUSEOVER, new AjxListener(this,this.removeHoverFromButton,[actionMenu]));
    actionMenu._dropDownEventsEnabled=false;
    actionMenu.getHtmlElement().setAttribute("title","Select action");
	actionMenu.setImage("TabChatButtonIcon","");
	//remove class ZLeftIcon for show chat icon
	if (actionMenu.getHtmlElement().getElementsByClassName("ZLeftIcon").length){
		var left_icon= actionMenu.getHtmlElement().getElementsByClassName("ZLeftIcon");
		left_icon.zb__NEW_MENU_left_icon.className = "ZWidgetIcon";
	}
	//actionMenu.setText("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<font  size=2em>"+biz_zcs_vnc_talk_zimlet.talk_zimlet_tab_chat_room_new+"</font>");
    actionMenu.setText(biz_zcs_vnc_talk_zimlet.talk_zimlet_tab_chat_room_new);
	var title = actionMenu.getHtmlElement().getElementsByClassName("ZWidgetTitle");
	title.zb__NEW_MENU_title.style.textAlign = "center";
	window.document.title = "Zimbra: " + zimletAppName;
		    if(this.jappixCommon == null){
          biz_zcs_vnc_talk_zimlet_this._progressBar();
  				setTimeout(function(){
  				    if(biz_zcs_vnc_talk_zimlet_this.progressDialog != null &&  biz_zcs_vnc_talk_zimlet_this.progressDialog.isPoppedUp()){
  							biz_zcs_vnc_talk_zimlet_this.progressDialog.popdown();
  					    }
  					    if(this.jappixCommon && !this.jappixCommon.isConnected()){
  						    if(this.videoChatTabInitialized){
  							    biz_zcs_vnc_talk_zimlet_HandlerObject.appDisabledMessage();
  						    }
  					    }
  				},5000);
        }else{
          if(!this.jappixCommon.isConnected()){
            if(this.videoChatTabInitialized){
                biz_zcs_vnc_talk_zimlet_HandlerObject.appDisabledMessage();
            }
          }else{
  					if(this.videoChatTabInitialized && !biz_zcs_vnc_talk_zimlet_HandlerObject.isConferenceRunning()){
  	          biz_zcs_vnc_talk_zimlet_HandlerObject.displayMessageInTab("");
  						biz_zcs_vnc_talk_zimlet_this.tabNewVideoConference.setEnabled(true);
  						this.tabNewVideoConference.addListener(DwtEvent.ONMOUSEOVER, new AjxListener(this,this.removeHoverFromButton,[this.tabNewVideoConference]));
              biz_zcs_vnc_talk_zimlet_this.menuJoinChat.setEnabled(true);
              biz_zcs_vnc_talk_zimlet_this.menuJoinVideo.setEnabled(true);
              //biz_zcs_vnc_talk_zimlet_this.menuImContact.setEnabled(true);
  					}
          }
        }


	}else{
	var title = actionMenu.getHtmlElement().getElementsByClassName("ZWidgetTitle");
	title.zb__NEW_MENU_title.style.textAlign = "";
	if (actionMenu.getHtmlElement().getElementsByClassName("ZLeftIcon").length ==0){
		var left_icon= actionMenu.getHtmlElement().getElementsByClassName("ZWidgetIcon");
		left_icon.zb__NEW_MENU_left_icon.className = "ZWidgetIcon ZLeftIcon";
	}

    actionMenu._dropDownEventsEnabled=true;
  }
	if (this.videoChatTabInitialized) {
		return;
	}
	switch (appName) {
		case biz_zcs_vnc_talk_zimlet_HandlerObject._vncChatApp:
			{
				var buttonIndex = 0;
				if (active) {
					var app = appCtxt.getApp(biz_zcs_vnc_talk_zimlet_HandlerObject._vncChatApp);
					overview = app.getOverview(); // returns ZmOverview
					if(overview){
						overview.removeChildren();
						biz_zcs_vnc_talk_zimlet_HandlerObject.TreeObj = this.biz_vnc_talk_overview_panelTree = biz_zcs_vnc_talk_zimlet_HandlerObject._createRootOfTree(overview, "VNCtalkTreeOverviewTree");
						var flag = true;
						this.biz_vnc_talk_overview_panelTree.addSelectionListener(new AjxListener(this, this._treeSelectionListener));
						var parent_list = {};
						parent_list["VNCtalkMenutree"] = this.biz_vnc_talk_overview_panelTree;
						/*biz_zcs_vnc_talk_zimlet_HandlerObject.favouriteTreeRoot = new DwtTreeItem({
							parent: this.biz_vnc_talk_overview_panelTree,
							text: "<font size='3px' style='font-weight:bold'>"+biz_zcs_vnc_talk_zimlet.vnc_talk_root_favourite_title+"</font>",
							imageInfo: "",
							forceNotifySelection: true,
							selectable: false,
						});*/
						biz_zcs_vnc_talk_zimlet_HandlerObject.chatRoomsTreeRoot = new DwtTreeItem({
							parent: this.biz_vnc_talk_overview_panelTree,
							text: "<font size='3px' style='font-weight:bold'>"+biz_zcs_vnc_talk_zimlet.vnc_talk_root_chatrooms_title+"</font>",
							imageInfo: "",
							forceNotifySelection: true,
							selectable: false,
							extraInfo:"chatRoomTree",
							arrowDisabled:true
						});
						//biz_zcs_vnc_talk_zimlet_HandlerObject.favouriteTreeRoot.setExpanded(true, false, false);
						biz_zcs_vnc_talk_zimlet_HandlerObject.chatRoomsTreeRoot.setExpanded(true, false, false);
						if(typeof JappixMini == "undefined"){
							return;
						}

						//Start the functions which will update the left side panel favorites and chatrooms periodically
						//if this functions are not yes started
						if (typeof biz_zcs_vnc_talk_zimlet_HandlerObject.updateChatroomsTreeInterval == 'undefined') {
								setTimeout( biz_zcs_vnc_talk_zimlet_HandlerObject.updateChatroomsTree, 0); //Initial fetch
								biz_zcs_vnc_talk_zimlet_HandlerObject.updateChatroomsTreeInterval = setInterval(
									biz_zcs_vnc_talk_zimlet_HandlerObject.updateChatroomsTree,
									5000);
						}
						/*if (typeof biz_zcs_vnc_talk_zimlet_HandlerObject.updateFavoriteContactsTreeInterval == 'undefined') {
							setTimeout( biz_zcs_vnc_talk_zimlet_HandlerObject.updateFavoriteContactsTree, 0);  //Initial fetch
							biz_zcs_vnc_talk_zimlet_HandlerObject.updateFavoriteContactsTreeInterval = setInterval(
								biz_zcs_vnc_talk_zimlet_HandlerObject.updateFavoriteContactsTree,
								5000);
						}*/

					}
					content = AjxTemplate.expand("biz_zcs_vnc_talk_zimlet.templates.biz_zcs_vnc_talk_zimlet_app_template#biz_zcs_vnc_talk_App");
					app.setContent(content);

					/*this.tabNewChatRoom = app.getToolbar().createButton({
						id: "btntabGroupChatroom",
						text: this.getMessage("talk_zimlet_tab_chat_room_new"),
						index: 0
					}, {
						id: "btntabGroupChatroom",
						text: this.getMessage("talk_zimlet_tab_chat_room_new"),
						index: 0
					});*/

					this.tabNewVideoConference = app.getToolbar().createButton({
						id: "btntabNewvideoconference",
						text: this.getMessage("talk_zimlet_tab_videoconference_room_new"),
						index: 0
					}, {
						id: "btntabNewvideoconference",
						text: this.getMessage("talk_zimlet_tab_videoconference_room_new"),
						index: 0
					});
					this.tabNewVideoConference.setImage("TabVideoButtonIcon","");
					this.tabNewVideoConference.addListener(DwtEvent.ONMOUSEOVER, new AjxListener(this,this.removeHoverFromButton,[this.tabNewVideoConference]));

					var button = app.getToolbar().createButton("talkTabButtonMore",{
						id: "btntabButtonMore",
						image:"",
						text:this.getMessage("talk_zimlet_tab_more_lbl"),
						tooltip:this.getMessage("talk_zimlet_tab_more_lbl"),
						index:1
					});

					var tabmenu = new ZmPopupMenu(button);
					button.setMenu(tabmenu);
					button.noMenuBar = true;
					button.removeAllListeners();
					button.removeDropDownSelectionListener();
					button.addListener(DwtEvent.ONMOUSEOVER, new AjxListener(this,this.removeHoverFromButton,[button]));
					button.addListener(DwtEvent.ONCLICK, new AjxListener(this,this.removeHoverFromButton,[button]));

					var mi = this.menuJoinChat = tabmenu.createMenuItem(Dwt.getNextId(), {
						image:"ChatJoin",
						text:this.getMessage("talk_zimlet_tab_more_groupchat")
					});

					mi.addSelectionListener(new AjxListener(this, this._tabChatJoinHandler));
					var mi = this.menuJoinVideo = tabmenu.createMenuItem(Dwt.getNextId(), {
						image:"VideoJoin",
						text:this.getMessage("talk_zimlet_tab_more_video")
					});

					mi.addSelectionListener(new AjxListener(this, this._tabChatJoinVideo));

					/*var mi = this.menuImContact = tabmenu.createMenuItem(Dwt.getNextId(), {
						image:"",
						text:this.getMessage("vnc_talk_zimlet_im_contact_btn_lbl")
					});

					mi.addSelectionListener(new AjxListener(this, this.imContactDialogListener));*/
          this.getUrlBtn = app.getToolbar().createButton({
            id: "btnGetUrl",
            text: "GetURL",
            index: 2,
          }, {
            id: "btnGetUrl",
            text: "GetURL",
            index: 2
          });
					app.getToolbar().addFiller("vnctalkspacertoolbar",5);
					this.button = app.getToolbar().createButton({
						id: "btnAddPeople",
						text: this.getMessage("addpeople"),
						index: 6,
					}, {
						id: "btnAddPeople",
						text: this.getMessage("addpeople"),
						index: 6
					});
					//this.button.setImage("NewContact","");
					this.button.setImage("DisconnectButtonIcon","");
					this.chatDisconnect = app.getToolbar().createButton({
						id: "btnDisconnectPeople",
						text: this.getMessage("diconnect"),
						index: 7
					}, {
						id: "btnDisconnectPeople",
						text: this.getMessage("disconnect"),
						index: 7
					});
					/*this.imContactBtn = app.getToolbar().createButton({
						id: "btnImContact",
						text: this.getMessage("vnc_talk_zimlet_im_contact_btn_lbl"),
						index: 3
					}, {
						id: "btnImContact",
						text: this.getMessage("vnc_talk_zimlet_im_contact_btn_lbl"),
						index: 3
					});*/
					document.getElementById("vnctalknopeopleinvited").innerHTML = this.getMessage("vnctalk_blank_screen_message");
					this.button.setVisible(false);
					this.chatDisconnect.setVisible(false);
          this.getUrlBtn.setVisible(false);
          this.getUrlBtn.addSelectionListener(
            new AjxListener(
              this,
              this.getVideoChatLink
            )
          );
					this.button.addSelectionListener(
						new AjxListener(
							this,
							//this.addPeopleListener
              				this.NewaddPeopleListener
						)
					);
					this.chatDisconnect.addSelectionListener(
						new AjxListener(
							this,
							this.disConnectPeopleListener
						)
					);
					/*this.imContactBtn.addSelectionListener(
						new AjxListener(
							this,
							this.imContactDialogListener
						)
					);*/

					/*this.tabNewChatRoom.addSelectionListener(
						new AjxListener(
							this,
							this.tabNewChatRoomListener
						)
					);*/

					this.tabNewVideoConference.addSelectionListener(
						new AjxListener(
							this,
							this.tabNewVideoConferenceListener,
							[this.tabNewVideoConference]
						)
					);
				}
				if(this.jappixCommon && !JappixCommon.isConnected()){

          biz_zcs_vnc_talk_zimlet_HandlerObject.appDisabledMessage();
        }else{
					biz_zcs_vnc_talk_zimlet_this.tabNewVideoConference.setEnabled(true);
					this.tabNewVideoConference.addListener(DwtEvent.ONMOUSEOVER, new AjxListener(this,this.removeHoverFromButton,[this.tabNewVideoConference]));
          biz_zcs_vnc_talk_zimlet_this.menuJoinChat.setEnabled(true);
          biz_zcs_vnc_talk_zimlet_this.menuJoinVideo.setEnabled(true);
          //biz_zcs_vnc_talk_zimlet_this.menuImContact.setEnabled(true);
				}
				//htk
				if(biz_zcs_vnc_talk_zimlet_HandlerObject.noConfiguration(true)) {
					biz_zcs_vnc_talk_zimlet_this.tabNewVideoConference.setEnabled(false);
          biz_zcs_vnc_talk_zimlet_this.menuJoinChat.setEnabled(false);
          biz_zcs_vnc_talk_zimlet_this.menuJoinVideo.setEnabled(false);
          //biz_zcs_vnc_talk_zimlet_this.menuImContact.setEnabled(false);
				}
				this.videoChatTabInitialized = true;
				break;
			}
			//htk
			case biz_zcs_vnc_talk_zimlet_HandlerObject._vncSoftPhoneApp:
			{
				if (active) {
					var app = appCtxt.getApp(biz_zcs_vnc_talk_zimlet_HandlerObject._vncSoftPhoneApp);
					overview = app.getOverview(); // returns ZmOverview
					overview.removeChildren();
					content = AjxTemplate.expand("biz_zcs_vnc_talk_zimlet.templates.biz_zcs_vnc_talk_zimlet_app_softphone_template#biz_zcs_vnc_talk_App_softPhone");
					app.setContent(content);
					var href = location.href;
					href = href.substr(0, href.indexOf(location.hostname)) + location.hostname;
					var link_softphone = href + "/softphone/";
					var iframe = $("#vncTalkAppSoftPhoneTabiFrame");
					iframe.attr("src", link_softphone);
				}
			break;
			}

	}
	//apply skin color
	var skins = ["vnc","bare","beach","bones","carbon","harmony","hotrod","lake","lavender","lemongrass","oasis","pebble","sand","serenity","sky","smoke","steel","tree","twilight","waves"];
	for (var i = 0; i < skins.length; i++) {
		jQuery('#btntabNewvideoconference table,#btntabButtonMore table,#btntabNewvideoconference_title,#btntabButtonMore_title,#btntabNewvideoconference_left_icon div,#zb__NEW_MENU_left_icon div.ImgTabChatButtonIcon').removeClass(skins[i]);
	};
    jQuery('#btntabNewvideoconference table,#btntabButtonMore table,#btntabNewvideoconference_title,#btntabButtonMore_title,#btntabNewvideoconference_left_icon div,#zb__NEW_MENU_left_icon div.ImgTabChatButtonIcon').addClass(window.appCurrentSkin);
	//if(!biz_zcs_vnc_talk_zimlet_HandlerObject.isBrowserGoogleCrome()){
	//	biz_zcs_vnc_talk_zimlet_HandlerObject.browserErrorMessage();
	//		appCtxt.setStatusMsg(biz_zcs_vnc_talk_zimlet.vnc_talk_browser_error_message+"<br> <a href=\"https://www.google.com/intl/en/chrome/browser\" target=\"_blank\">"+biz_zcs_vnc_talk_zimlet.vnc_talk_google_crome_download_msg);

	//}
};


biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._tabChatJoinHandler = function() {
	inviteToGroupchatFromLeftSidePanel(handleInviteToGroupchatFromLeftSidePanel);
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._tabChatJoinVideo = function() {
	joinVideoconferenceFromLeftSidePanel(handleJoinVideoconferenceFromLeftSidePanel);
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.tabNewChatRoomListener = function(ev) {
	if(JappixCommon && JappixCommon.isConnected()){
		if(appCtxt.getApp(biz_zcs_vnc_talk_zimlet_HandlerObject._vncChatApp)._active==true){
			this._createRoomContextMenu();
		}
	}
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.tabNewVideoConferenceListener = function(item) {
  jQuery(item.getHtmlElement()).removeClass('ZHover');
  //this._startVideoContextMenu();
  //New design popup
  this.NewaddPeopleListener();
}
biz_zcs_vnc_talk_zimlet_HandlerObject.startUpdateLeftSidePanelFunctions = function() {

};

biz_zcs_vnc_talk_zimlet_HandlerObject.updateChatroomsTree = function() {
	JappixMini.getAllAvailableChatrooms(function(roomList) {
		biz_zcs_vnc_talk_zimlet_HandlerObject.chatRoomsTreeRoot.removeChildren();
		biz_zcs_vnc_talk_zimlet_HandlerObject.chatRoomsTreeRoot.setExpanded(true, true, false);
		for (var i = 0; i < roomList.length; i++) {
			var roomNameFullJID = roomList[i];
			var roomNameDisplayName = roomNameFullJID.split("@")[0];
			/*Code to add the tree in Groupchat Tree */
			var childTree = new DwtTreeItem({
				parent: biz_zcs_vnc_talk_zimlet_HandlerObject.chatRoomsTreeRoot,
				text: roomNameDisplayName,
				imageInfo: "GroupTalk",
				forceNotifySelection: true,
				selectable: true,
				extraInfo: roomNameFullJID,
				arrowDisabled:true
			});
			childTree.setExpanded(true, true, false);
		}
	});
}

biz_zcs_vnc_talk_zimlet_HandlerObject.updateFavoriteContactsTree = function() {
	JappixMini.getOnlineFavoriteContacts(function(contactList) {
		biz_zcs_vnc_talk_zimlet_HandlerObject.favouriteTreeRoot.removeChildren();
		biz_zcs_vnc_talk_zimlet_HandlerObject.favouriteTreeRoot.setExpanded(true, true, false);
		for (var i = 0; i < contactList.length; i++) {
			var jid = contactList[i];
			var contactName = JappixMini.getDisplayNameFromJID(jid);
			/*Code to add the tree in Groupchat Tree */
			var childTree = new DwtTreeItem({
				parent:biz_zcs_vnc_talk_zimlet_HandlerObject.favouriteTreeRoot,
				text: contactName,
				imageInfo: "UserTalk",
				forceNotifySelection: true,
				selectable: true,
				extraInfo: jid,
				arrowDisabled:true
			});
			childTree.setExpanded(true, true, false);
		}
	});
}

biz_zcs_vnc_talk_zimlet_HandlerObject._createRootOfTree = function(root_parent, root_class) {
	return new DwtTree({
		parent: root_parent,
		style: DwtTree.SINGLE_STYLE,
		className: root_class,
		isCheckedByDefault: false,
		posStyle: DwtControl.ABSOLUTE_STYLE,
		className:"talkfavouriteusertree"
	});
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.itemContextMenu = function(args) {
  op = {};
  op.id = "VNCtalkDeleteItem";
  op.text = "Delete";
  op.tooltip = "VNCtalkDeleteItem";
  var overrides = {};
  overrides["VNCtalkDeleteItem"] = op;
  this._itemActionMenus = new ZmActionMenu({parent:appCtxt.getShell(),menuItems:["VNCtalkDeleteItem"], overrides:overrides, controller:appCtxt.getCurrentController(), context:appCtxt.getCurrentView()});

  var mi = this._itemActionMenus.getOp(op.id);
  if (op == ZmOperation.FORMAT_HTML) {
    mi.setData(ZmHtmlEditor._VALUE, DwtHtmlEditor.HTML);
  } else if (op == ZmOperation.FORMAT_TEXT) {
    mi.setData(ZmHtmlEditor._VALUE, DwtHtmlEditor.TEXT);
  }
  mi.setData(ZmOperation.KEY_ID, op.id);
  this._itemActionMenus.addSelectionListener("VNCtalkDeleteItem", new AjxListener(this,this._itemSelectionListener, args));
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._itemSelectionListener = function(args, ev){
   if(ev.detail == DwtTree.ITEM_SELECTED){
      deleteContactToFavoriteFromLeftSidePanel(args.jid);
      this._itemActionMenus.popdown(0, args.x, args.y);
   }
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._treeSelectionListener = function(ev) {
	if (ev.detail == DwtTree.ITEM_SELECTED) {
		var selectedItem = this.biz_vnc_talk_overview_panelTree.getSelection()[0];
		if(selectedItem.parent._extraInfo=="favouriteTree"){
			favoriteContactFromLeftSidePanelSelected(selectedItem);
		}
		if(selectedItem.parent._extraInfo=="chatRoomTree"){
			groupChatFromLeftSidePanelSelected(selectedItem);
		}
	}

  //handle right-click
  if (ev.detail == DwtTree.ITEM_ACTIONED) {
    var selectedItem = biz_zcs_vnc_talk_zimlet_HandlerObject.TreeObj._actionedItem;
    if(selectedItem.parent._extraInfo=="favouriteTree"){
      var args = {jid: selectedItem._extraInfo, x: ev.docX, y: ev.docY};
      this.itemContextMenu(args);
      this._itemActionMenus.popup(0, ev.docX, ev.docY);
    }
  }
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._actionMenuContextListener = function(ev){
	if(JappixCommon && JappixCommon.isConnected()){
		if(ev.button==DwtMouseEvent.RIGHT || ev.button==DwtMouseEvent.LEFT){
			if(appCtxt.getApp(biz_zcs_vnc_talk_zimlet_HandlerObject._vncChatApp)._active==true){
				this._participantActionMenus.popup(0, ev.docX, ev.docY);
			}
		}
	}
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.favoriteContactFromLeftSidePanelSelected = function(item) {
	console.log("DEPRECATED");
	console.log(item);
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.groupChatFromLeftSidePanelSelected = function(item) {
	console.log("DEPRECATED");
	console.log(item);
}

biz_zcs_vnc_talk_zimlet_HandlerObject.displayMessageInTab = function(message){
        var app = appCtxt.getApp(biz_zcs_vnc_talk_zimlet_HandlerObject._vncChatApp);
        if (!app.isActive()) {
                   app.activate(true);
        }
        appCtxt.getCurrentApp().pushView(biz_zcs_vnc_talk_zimlet_HandlerObject._vncChatApp);
        var iframes = document.getElementsByName("vncTalkAppTabiFrame");
        document.getElementById('vncTalkAppTabiFrame').contentWindow.document.body.innerHTML="";
        var doc=document.getElementById('vncTalkAppTabiFrame').contentWindow.document;
        doc.open();
        doc.write(message);
        doc.close(message);
}

biz_zcs_vnc_talk_zimlet_HandlerObject.browserErrorMessage=function(){
        var message = "<html><head><style>html, body {height: 100%;margin: 0;padding: 0;width: 100%;}body {display: table;}.my-block {text-align: center;display: table-cell;vertical-align: middle;}</style></head><body><div class=\"my-block\">"+biz_zcs_vnc_talk_zimlet.vnc_talk_browser_error_message+"<br><a target=\"_blank\" href=\"https://www.google.com/intl/en/chrome/browser\">"+biz_zcs_vnc_talk_zimlet.vnc_talk_google_crome_download_msg + "</div></body></html>";
        biz_zcs_vnc_talk_zimlet_HandlerObject.displayMessageInTab(message);
};

biz_zcs_vnc_talk_zimlet_HandlerObject.appDisabledMessage = function(){
        var message = "<html><head><style>html, body {height: 100%;margin: 0;padding: 0;width: 100%;}body {display: table;}.my-block {text-align: center;display: table-cell;vertical-align: middle;}</style></head><body><div class=\"my-block\">";
        message = message+biz_zcs_vnc_talk_zimlet_this.getMessage("vnc-talk_app_disabled_message");
        message = message+"</div></body></html>";
        //disable button
        biz_zcs_vnc_talk_zimlet_this.tabNewVideoConference.setEnabled(false);
        biz_zcs_vnc_talk_zimlet_this.menuJoinChat.setEnabled(false);
        biz_zcs_vnc_talk_zimlet_this.menuJoinVideo.setEnabled(false);
        //biz_zcs_vnc_talk_zimlet_this.menuImContact.setEnabled(false);
        //close video if exist
        if(biz_zcs_vnc_talk_zimlet_HandlerObject.isConferenceRunning()){
            biz_zcs_vnc_talk_zimlet_HandlerObject.currentRoomId = null;
            var iframes = document.getElementsByName("vncTalkAppTabiFrame");
            biz_zcs_vnc_talk_zimlet_this.button.setVisible(false);
            biz_zcs_vnc_talk_zimlet_this.chatDisconnect.setVisible(false);
            biz_zcs_vnc_talk_zimlet_this.getUrlBtn.setVisible(false);
            for (var i = 0; i < iframes.length; i++) {
                iframes[i].contentWindow.postMessage({key:"disconnect",value:""},"*");
                iframes[i].src = "about:blank";
            }

            //remove iframe
            jQuery("#vncTalkAppTab iframe#vncTalkAppTabiFrame").remove();
			var restore_iframe = '<iframe id="vncTalkAppTabiFrame" name="vncTalkAppTabiFrame" src="about:blank" class="VNCtalk_appTabiFrame" scrolling="no"></iframe>';
			jQuery("#vncTalkAppTab").append(restore_iframe);
        }
        //display message
        biz_zcs_vnc_talk_zimlet_HandlerObject.displayMessageInTab(message);
};

biz_zcs_vnc_talk_zimlet_HandlerObject.isBrowserGoogleCrome= function(){
		var app = appCtxt.getApp(biz_zcs_vnc_talk_zimlet_HandlerObject._vncChatApp);
		if(!navigator.webkitGetUserMedia){
			return false;
		}else{
		return true;
		}

};

biz_zcs_vnc_talk_zimlet_HandlerObject.isConferenceRunning = function(){
        var videoChatFrame = document.getElementById("vncTalkAppTabiFrame");
        if(videoChatFrame){
                if(videoChatFrame.src == "about:blank"){
                        return false;
                }else{
                        return true;
                }
        }else{
                return false;
        }
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.disConnectPeopleListener = function(){
		var disconnectMeetingDialog=appCtxt.getConfirmationDialog();
        disconnectMeetingDialog.popup(biz_zcs_vnc_talk_zimlet_this.getMessage("vnc_talk_videochat_disconnect_confirmation"),new  AjxListener(this, function(){
        JappixMini.removeColorTab(biz_zcs_vnc_talk_zimlet_HandlerObject.currentRoomId);
	      biz_zcs_vnc_talk_zimlet_HandlerObject.currentRoomId = null;
        var iframes = document.getElementsByName("vncTalkAppTabiFrame");
	      this.button.setVisible(false);
	      this.chatDisconnect.setVisible(false);
        this.getUrlBtn.setVisible(false);
	      biz_zcs_vnc_talk_zimlet_this.tabNewVideoConference.setEnabled(true);
	      this.tabNewVideoConference.addListener(DwtEvent.ONMOUSEOVER, new AjxListener(this,this.removeHoverFromButton,[this.tabNewVideoConference]));
        biz_zcs_vnc_talk_zimlet_this.menuJoinVideo.setEnabled(true);
        for (var i = 0; i < iframes.length; i++) {
        iframes[i].contentWindow.postMessage({key:"disconnect",value:""},"*");
        iframes[i].src = "about:blank";
        JappixMini.updateGroups();
        //JappixMini.removeJappixNotification();
	biz_zcs_vnc_talk_zimlet_this.getShell().getHtmlElement().style.transform = '';
        jQuery('body').find('#jappix_notification ,.active_video_conference_notification').remove();
        }
    }));

};

biz_zcs_vnc_talk_zimlet_HandlerObject._validateInvitees = function(invitees){
   //Check if invalid username id is entered
   var inviteeRegex = RegExp(/[`~!#$%\^&*+=\[\]\\';,/{}|\\":<>\?\\\)\(]/g);
   var inValidUser =  [];
   var _invitees =  [];
   var userList = invitees.split(';');
   //Pushing all invitees list into array and validating them.
   for(var i = 0; i<userList.length; i++){
        var currentUser = userList[i];
        var isValidUser = inviteeRegex.test(currentUser);
        if(isValidUser){
            inValidUser.push(currentUser);
        }else{
            _invitees.push(currentUser);
        }
   }
    //Alert user if wrong invitee entered into invitee list.
    if(inValidUser.length > 0){
        console.log('inValidUser\n', inValidUser);
        var content = "Following are invalid username.Please correct it.<br/>";
        for(var i=0; i<inValidUser.length; i++){
          content = content + inValidUser[i]+"<br/>";
        }
        var msg =  appCtxt.getMsgDialog();
        msg.setMessage(content,DwtMessageDialog.WARNING_STYLE);
        msg.popup();
    }
    if (inValidUser.length > 0)
      return false;
    else
      return true;
}


biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._invitePeopleDialogOkListener = function() {
  var invitees = this.emailInput.getValue();
  if (invitees == ""){
  	JappixMini.createJappixNotification("notify_user_unavailable");
        setTimeout(function() {
            JappixMini.removeJappixNotification()
        }, 3000);
  }else{
        if (invitees.indexOf(';') == -1) {
            invitee_arr = [invitees];
        } else {
            invitee_arr = invitees.split(';');
        }
        for (var i = 0; i< invitee_arr.length; i++){
            invitee_arr[i] = invitee_arr[i].trim();
            if (invitee_arr[i] ==""){
                invitee_arr.pop(invitee_arr[i]);
            }
        }
        invitee_arr = arrayUnique(invitee_arr);
        for (var x = 0; x < invitee_arr.length; x++) {
            if (!JappixMini.checkEmail(invitee_arr[x])){
                JappixMini.createJappixNotification("error_email");
                return true;
            }
        }
    }
  this.invitePeopleDialog.popdown();
  JappixMini.sendInvitationToJoinRoom(invitees);
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._startNewConference = function(invitee,roomId) {
    var roomID = this.checkValidSubject(roomId);
    if(!roomID){
        return;
    }

    if (biz_zcs_vnc_talk_zimlet_HandlerObject._validateInvitees(invitee)) {
        biz_zcs_vnc_talk_zimlet.otherParty = invitee;
        biz_zcs_vnc_talk_zimlet_HandlerObject.sendVideoChatInvitation(roomID,biz_zcs_vnc_talk_zimlet_HandlerObject.isConferenceRunning());
        var nopeopleinvited = document.getElementById("vnctalknopeopleinvited");
        if(nopeopleinvited !=null){
            nopeopleinvited.parentNode.removeChild(nopeopleinvited);
        }
    };
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._addPeopleDialogOkListener = function() {
	var username = this.emailInputField.getValue();
	biz_zcs_vnc_talk_zimlet.meetingTopic = this.subjectInputField.getValue();
	var roomID = this.checkValidSubject(biz_zcs_vnc_talk_zimlet.meetingTopic);
  if(!roomID){
    return;
  }

  if (biz_zcs_vnc_talk_zimlet_HandlerObject._validateInvitees(username)) {
    biz_zcs_vnc_talk_zimlet.otherParty = username;
    biz_zcs_vnc_talk_zimlet_HandlerObject.sendVideoChatInvitation(roomID,biz_zcs_vnc_talk_zimlet_HandlerObject.isConferenceRunning());
    var nopeopleinvited = document.getElementById("vnctalknopeopleinvited");
    if(nopeopleinvited !=null){
      nopeopleinvited.parentNode.removeChild(nopeopleinvited);
    }
  };
  biz_zcs_vnc_talk_zimlet_this.addPeopleDialog.popdown();
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.notAsciiOnly = function(str) {
    for (var i = 0; i < str.length; i++){
        if (str.charCodeAt(i) > 127){
           return true;
        }
    }
    return false;
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.replaceUmlauts = function(umlauts,grouproster){
    if(grouproster){
        umlauts = umlauts.replace(/\u00e4/g, "ae");
        umlauts = umlauts.replace(/\u00f6/g, "oe");
        umlauts = umlauts.replace(/\u00fc/g, "ue");
        umlauts = umlauts.replace(/\u00df/g, "ss");
        umlauts = umlauts.replace(/\u00c4/g, "Ae");
        umlauts = umlauts.replace(/\u00d6/g, "Oe");
        umlauts = umlauts.replace(/\u00dc/g, "Ue");
        return umlauts;
    }else{
	var g = umlauts.toUpperCase().toLowerCase();
	g = g.replace(/\u00e4/g, "ae");
	g = g.replace(/\u00f6/g, "oe");
	g = g.replace(/\u00fc/g, "ue");
	g = g.replace(/\u00df/g, "ss");
	return g;
    }
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.checkValidSubject = function(subject) {
    if (AjxUtil.isEmpty(subject)){
        var tmp = generateRoomIDMini();
    } else {
        var tmp = subject;

        tmp = tmp.trim();

        //Remove invalid characters
        pattern = new RegExp(/[`.~@!#$%\^&*+=\[\]\\';,/{}|\\":<>\?()]/);
        if(pattern.test(tmp)) {
            var msg =  appCtxt.getMsgDialog();
            msg.setMessage(biz_zcs_vnc_talk_zimlet.talk_msg_invalid_character,DwtMessageDialog.WARNING_STYLE);
            msg.popup();
            return;
        }
        //room name must <= 256 characters
        if(tmp.length > 256) {
            var msg =  appCtxt.getMsgDialog();
            msg.setMessage(biz_zcs_vnc_talk_zimlet.talk_msg_room_name_too_long,DwtMessageDialog.WARNING_STYLE);
            msg.popup();
            return;
        }

        //Replace space to underscore
        tmp = tmp.replace(/\s+/g,"_");
	tmp = tmp.toLowerCase();
	tmp = this.replaceUmlauts(tmp);
    }
    return tmp;
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.imContactDialogListener = function() {
	this.groupTreeSelected = false;
	JappixMini.getAllRosterGroupsUsers(function(res){
	   biz_zcs_vnc_talk_zimlet_HandlerObject.treeContactCreate(res);
	   biz_zcs_vnc_talk_zimlet_this.contactListSelectBtn.setEnabled(true);
	});
	if(this.talkContactDialog){
		this.contactTreeMoveBtn.setEnabled(false);
		this.contactSearchField.setValue("");
		this.listview.setUI(null);
		this.listview.set(null,true);
		this.talkContactDialog.popup();
		return;
	}
	JappixMini.getAllRosterGroupsUsers(function(res){
		for(jsonObject in res){
			if(jsonObject!="General"){
				JappixMini.addNewRosterGroupsUsers(null, "General", function(res){});
			}
		}
	});
	this.talkContactDialogView = new DwtComposite(this.getShell());
	this.talkContactDialogView.setSize("900px", "500px");
	var dataArray = {
		random:this.random
	}
	this.talkContactDialogView.getHtmlElement().innerHTML = AjxTemplate.expand("biz_zcs_vnc_talk_zimlet.templates.contactsearchdialog#talkzimletcontactsearch",dataArray);
	 this.talkContactDialog = new ZmDialog({
		title:"<img src="+this.getResource("icon-close.png")+" style='cursor:pointer;' onclick='biz_zcs_vnc_talk_zimlet_HandlerObject.closeImDialog();'></img><center style='font-size:20px;'>"+this.getMessage("talk_zimlet_contact_ui_dialog_title")+"</center>",
		view: this.talkContactDialogView,
		parent: this.getShell(),
		standardButtons: [DwtDialog.DISMISS_BUTTON]
	});
	this.talkContactDialog.getButton(DwtDialog.DISMISS_BUTTON).setText(ZmMsg.close);
	biz_zcs_vnc_talk_zimlet_this.contactTreeObject = new DwtTree({parent:this.talkContactDialog,style:DwtTree.SINGLE_STYLE,className:"vnc_talk_contact_dialog_tree",isCheckedByDefault:false,posStyle:DwtControl.ABSOLUTE_STYLE,id:"vnc_talk_tree_dialog"+biz_zcs_vnc_talk_zimlet_this.random});
	biz_zcs_vnc_talk_zimlet_this.contactTreeObject.addSelectionListener(new AjxListener(this, this._contactTreeListener));
	this.createContactTreeView();
	this.contactSearchField = new DwtInputField({
		parent: this.getShell(),
		type: DwtInputField.STRING,
		size:42
	});
	this.contactSearchField.addListener(DwtEvent.ONKEYUP,new AjxListener(this, this._contactSearchFieldKeyEvent));
	this.contactSearchButton = new DwtButton({
		parent: this.getShell()
	});
	this.contactSearchButton.setText(ZmMsg.search);
	this.contactSearchButton.addSelectionListener(new AjxListener(this, this._contactSearchListener));
	document.getElementById("talk_search_textbox"+this.random).appendChild(this.contactSearchField.getHtmlElement());
	document.getElementById("talk_search_button"+this.random).appendChild(this.contactSearchButton.getHtmlElement());

	this.contactListSelectBtn = new DwtButton({
		parent: this.getShell()
	});
	this.contactListSelectBtn.setText(this.getMessage("vnc_talk_add_select_btn"));
	this.contactListSelectBtn.addSelectionListener(new AjxListener(this, this._listSelectBtnListener));
	document.getElementById("vnc_talk_selected_btn"+this.random).appendChild(this.contactListSelectBtn.getHtmlElement());


	this.contactTreeDeleteBtn = new DwtButton({
		parent: this.getShell()
	});
	this.contactTreeDeleteBtn.setText(this.getMessage("zcs_vnc_talk_contact_btn_delete"));
	this.contactTreeDeleteBtn.addSelectionListener(new AjxListener(this, this._contactdeleteTreeBtnListener));
	document.getElementById("vnc_talk_delete_tree"+this.random).appendChild(this.contactTreeDeleteBtn.getHtmlElement());


	this.contactTreeMoveBtn = new DwtButton({
		parent: this.getShell()
	});
	this.contactTreeMoveBtn.setText(this.getMessage("zcs_vnc_talk_contact_btn_move"));
	this.contactTreeMoveBtn.addSelectionListener(new AjxListener(this, this._contactTreeMoveBtnListener));
	this.contactTreeMoveBtn.setEnabled(false);
	document.getElementById("vnc_talk_move_tree"+this.random).appendChild(this.contactTreeMoveBtn.getHtmlElement());


	this.contactTreenewGroup = new DwtButton({
		parent: this.getShell()
	});
	this.contactTreenewGroup.setText(this.getMessage("zcs_vnc_talk_contact_btn_new_group"));
	this.contactTreenewGroup.addSelectionListener(new AjxListener(this, this._contactNewGroupBtnListener));
	document.getElementById("vnc_talk_new_group_tree"+this.random).appendChild(this.contactTreenewGroup.getHtmlElement());

	var listHeaders = [];
	listHeaders.push(
			new DwtListHeaderItem(
				{
					field:"Type",
					text:this.getMessage("vnc_talk_list_type"),
					align:DwtLabel.ALIGN_LEFT,
					resizeable:true,
					width:"80",
					sortable:this.getMessage("vnc_talk_list_type"),
					noRemove:"true"
				}
			)
	);
	listHeaders.push(
			new DwtListHeaderItem(
				{
					field:"EmailAddress",
					text:this.getMessage("vnc_talk_email_address"),
					align:DwtLabel.ALIGN_LEFT,
					resizeable:true,
					width:"220",
					sortable:this.getMessage("vnc_talk_email_address"),
					noRemove:"true"}
				)
			);
	listHeaders.push(
			new DwtListHeaderItem(
				{
					field:"DisplayName",
					text:this.getMessage("vnc_talk_display_name"),
					align:DwtLabel.ALIGN_LEFT,
					resizeable:true,
					width:"",
					sortable:this.getMessage("vnc_talk_display_name")
				}
			)
		);
	var paramsList = {parent:new DwtComposite(this.getShell()),headerList:listHeaders,controller:new ZmListController(this,appCtxt.getCurrentApp()),scroll:true,id:"vnc_talk_list_selection_tab",className:"",posStyle: DwtControl.RELATIVE_STYLE,className:"vnc_talk_list_selection_tab"};
	this.listview = new biz_vnc_contact_AddressbookList(paramsList);
	this.listview.setUI(null);
	this.listview._initialized = true;
	this.listview.set(null,true);
	this.listview.setScrollStyle(Dwt.SCROLL);
	document.getElementById("vnc_talk_selection_list"+this.random).appendChild(this.listview.getHtmlElement())
	this.talkContactDialog.popup();
};

biz_zcs_vnc_talk_zimlet_HandlerObject.closeImDialog = function(){
	biz_zcs_vnc_talk_zimlet_this.talkContactDialog.popdown();
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._contactSearchFieldKeyEvent = function(ev){
	if(ev.charCode==13){
		this._contactSearchListener();
	}
}
biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.createContactTreeView = function(){
	biz_zcs_vnc_talk_zimlet_this.contactTreeObject.removeChildren();
	this.groupTreeSelected = false;
	JappixMini.getAllRosterGroupsUsers(function(res){
		biz_zcs_vnc_talk_zimlet_HandlerObject.treeContactCreate(res);
		biz_zcs_vnc_talk_zimlet_this.contactListSelectBtn.setEnabled(true);
	});
};

biz_zcs_vnc_talk_zimlet_HandlerObject.treeContactCreate = function(object){
    biz_zcs_vnc_talk_zimlet_this.contactTreeObject.removeChildren();
	document.getElementById("vnc_talk_tree_dialog"+biz_zcs_vnc_talk_zimlet_this.random).appendChild(biz_zcs_vnc_talk_zimlet_this.contactTreeObject.getHtmlElement());
	biz_zcs_vnc_talk_zimlet_HandlerObject.contactGroupNameArray = [];
	var totalGroupSize = Object.keys(object).length;
	for(jsonObject in object){
		var treeName = jsonObject;
		biz_zcs_vnc_talk_zimlet_HandlerObject.contactGroupNameArray.push(treeName);
		var root=new DwtTreeItem({
			parent:biz_zcs_vnc_talk_zimlet_this.contactTreeObject,
			text:treeName,extraInfo:"",
			imageInfo:"",
			selectable:true,
			className:'contactdialogtreeitem',
			arrowDisabled:true
		});
		var treeItems = object[jsonObject];
		for(var i=0;i<treeItems.length;i++){
			var treeAdd = new DwtTreeItem({
				parent:root,
				text:treeItems[i].displayName,
				extraInfo:treeItems[i].jid,
				imageInfo:"",
				selectable:true,
				arrowDisabled:true
			});
			if(totalGroupSize==1){
				treeAdd.setExpanded(true, true, false)
			}
		}
	}
};
biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._contactTreeListener = function(ev){
	this.groupTreeSelected = true;
	this.groupTreeEvent = ev;
  //check is right click event
  if(ev.detail == DwtTree.ITEM_SELECTED){
    this.contactTreeMoveBtn.setEnabled(true);
  }
};
biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._contactdeleteTreeBtnListener = function() {
	if(this.groupTreeSelected){
    var title = biz_zcs_vnc_talk_zimlet.vnctalk_delete_title;
    var content = "";
		var groupName = this.groupTreeEvent.items[0]._text;
		var parents = this.groupTreeEvent.items[0].parent;
		if(!parents._origClassName){
			var groupName = this.groupTreeEvent.items[0]._text;
			content = this.getMessage("vnc_talk_delete_dialog_msg").replace("GROUP_", groupName)+"?";
		}else{
			var groupName = this.groupTreeEvent.items[0].parent._text;
			var item = this.groupTreeEvent.items[0]._extraInfo;
			content = this.getMessage("vnc_talk_from_lbl_contact_ui").replace("USER_", this.groupTreeEvent.items[0]._text);
            content = content.replace("GROUP_", groupName) + "?";

		}
    this._delete_dialog = JappixMini.createYesNoDialog(title, content, this._deleteyesBtnListener, this._deletenoBtnListener);
		this._delete_dialog.popup();
	}
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._deleteyesBtnListener = function() {
	if(this.groupTreeSelected){
		var groupName = this.groupTreeEvent.items[0]._text;
		var parents = this.groupTreeEvent.items[0].parent;
		if(!parents._origClassName){
			var groupName = this.groupTreeEvent.items[0]._text;
			JappixMini.removeRosterGroupsUsers(null, groupName, this.createContactTreeView);
		}else{
			var groupName = this.groupTreeEvent.items[0].parent._text;
			var item = this.groupTreeEvent.items[0]._extraInfo;
			// if(groupName=="General"){
			// 	JappixMini.removeRosterGroupsUsers(item, null, this.createContactTreeView);
			// }else{
			JappixMini.removeRosterGroupsUsers(item, groupName, this.createContactTreeView);
			// }
		}
		//this.createContactTreeView();
	}
	this.groupTreeSelected=false;
	this._delete_dialog.popdown();
};
biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._deletenoBtnListener = function() {
	this._delete_dialog.popdown();
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._contactTreeMoveBtnListener = function() {
	if(this.contactMoveDialogDialog){
		var selectOptions = [];
		if(this.groupTreeSelected){
			var groupName = this.groupTreeEvent.items[0]._text;
			var parents = this.groupTreeEvent.items[0].parent;
			if(!parents._origClassName){
				var msg = appCtxt.getMsgDialog();
				msg.reset();
				msg.setMessage(this.getMessage("vnc_talk_move_dialog_info_msg"),DwtMessageDialog.INFO_STYLE);
				msg.popup();
				return;
			}else{
				var selectedGroupName = this.groupTreeEvent.items[0].parent._text;
				for(var i=0 ; i<biz_zcs_vnc_talk_zimlet_HandlerObject.contactGroupNameArray.length;i++){
					var groupName = biz_zcs_vnc_talk_zimlet_HandlerObject.contactGroupNameArray[i];
					var displayName = groupName;
					if(groupName.length>20){
						displayName = groupName.substring(0, 19) + "...";
					}
					if(selectedGroupName!=groupName){
						selectOptions.push(new DwtSelectOption(groupName, true, displayName,null,null,null,null,null,""));
					}
				}
        if(selectOptions.length == 0){return}
			}
		}
		this.show_options = new DwtSelect({
			parent: this.contactMoveDialogDialog,
			options: selectOptions,
			id: "vnc_talk_zimlet_showOptions",
			layout: DwtMenu.LAYOUT_STACK
		});
		document.getElementById("vnc_talk_move_drop_down_"+this.random).innerHTML = "";
		document.getElementById("vnc_talk_move_drop_down_"+this.random).appendChild(this.show_options.getHtmlElement());
		this.contactMoveDialogDialog.popup();
		return;
	}
	var parentView = new DwtComposite(this.getShell());
	parentView.setSize("270px", "75px");
	parentView.getHtmlElement().innerHTML = "<div style='float:left;margin-top: 4px;'>"+this.getMessage("vnc_talk_group_select_group_lbl")+"</div><div style='float: left;margin-left: 17px;' id='vnc_talk_move_drop_down_"+this.random+"'>";
	this.contactMoveDialogDialog = new ZmDialog({
		title: this.getMessage("vnc_talk_contact_move_title"),
		view: parentView,
		parent: this.getShell(),
		standardButtons: [DwtDialog.OK_BUTTON, DwtDialog.DISMISS_BUTTON]
	});
	this.contactMoveDialogDialog.setButtonListener(
		DwtDialog.OK_BUTTON,
			new AjxListener(
				this,
				this._moveDialogOkListener
			)
	);
	var selectOptions = [];
	if(this.groupTreeSelected){
		var groupName = this.groupTreeEvent.items[0]._text;
		var parents = this.groupTreeEvent.items[0].parent;
		if(!parents._origClassName){
			var msg = appCtxt.getMsgDialog();
			msg.reset();
			msg.setMessage(this.getMessage("vnc_talk_move_dialog_info_msg"),DwtMessageDialog.INFO_STYLE);
			msg.popup();
			return;
		}else{
			var selectedGroupName = this.groupTreeEvent.items[0].parent._text;
			for(var i=0 ; i<biz_zcs_vnc_talk_zimlet_HandlerObject.contactGroupNameArray.length;i++){
				var groupName = biz_zcs_vnc_talk_zimlet_HandlerObject.contactGroupNameArray[i];
				var displayName = groupName;
				if(groupName.length>20){
					displayName = groupName.substring(0, 19) + "...";
				}
				if(selectedGroupName!=groupName){
					selectOptions.push(new DwtSelectOption(groupName, true, displayName,null,null,null,null,null,""));
				}
			}
      if(selectOptions.length == 0){return}
		}
	}
	this.show_options = new DwtSelect({
		parent: this.contactMoveDialogDialog,
		options: selectOptions,
		id: "vnc_talk_zimlet_showOptions",
		layout: DwtMenu.LAYOUT_STACK
	});
	document.getElementById("vnc_talk_move_drop_down_"+this.random).appendChild(this.show_options.getHtmlElement());
	this.show_options.setSize("100px");
	this.contactMoveDialogDialog.popup();
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._moveDialogOkListener = function(){
	var groupName = this.groupTreeEvent.items[0].parent._text;
	var item = this.groupTreeEvent.items[0]._extraInfo;
	var newGroupName = this.show_options.getSelectedOption()._value;
	JappixMini.moveRosterGroupsUsers(item, groupName, newGroupName, this.createContactTreeView);
	//this.createContactTreeView();
  //Disable button move untill user select contact
  this.contactTreeMoveBtn.setEnabled(false);
	this.contactMoveDialogDialog.popdown();
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._contactNewGroupBtnListener = function() {
	if(this.contactCreateGroupDialog){
		this.contactNewGroupTextField.setValue("");
		this.contactCreateGroupDialog.popup();
		return;
	}
	var parentView = new DwtComposite(this.getShell());
	parentView.setSize("270px", "75px");
	parentView.getHtmlElement().innerHTML = "<div style='float:left;'>"+this.getMessage("vnc_talk_group_create_lbl")+"</div> <div id='vnc_talk_newgroup_text_"+this.random+"'>";
	this.contactCreateGroupDialog = new ZmDialog({
		title: this.getMessage("vnc_talk_contact_group_dialog_title"),
		view: parentView,
		parent: this.getShell(),
		standardButtons: [DwtDialog.OK_BUTTON, DwtDialog.DISMISS_BUTTON]
	});
	this.contactCreateGroupDialog.setButtonListener(
		DwtDialog.OK_BUTTON,
			new AjxListener(
				this,
				this._contactNewGroupDialogOkListener
			)
	);
	this.contactNewGroupTextField = new DwtInputField({
		parent: this.contactCreateGroupDialog,
		type: DwtInputField.STRING,
		size:24
	});
	this.contactNewGroupTextField.addListener(DwtEvent.ONKEYUP,new AjxListener(this, this._contactNewGroupKeyEvent));
	document.getElementById("vnc_talk_newgroup_text_"+this.random).appendChild(this.contactNewGroupTextField.getHtmlElement());
	this.contactCreateGroupDialog.popup();
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._contactNewGroupKeyEvent = function(ev){
	if(ev.charCode==13){
		this._contactNewGroupDialogOkListener();
	}
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._contactNewGroupDialogOkListener = function() {
	var groupName = this.contactNewGroupTextField.getValue();
	JappixMini.addNewRosterGroupsUsers(null, groupName, this.createContactTreeView);
	this.contactCreateGroupDialog.popdown();
	//this.createContactTreeView();
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._listSelectBtnListener = function() {
	this.contactListSelectBtn.setEnabled(false);
	var selection = this.listview.getSelection();
	if(selection.length>0){
		for(var i=0;i<selection.length;i++){
			if(selection[i].Type=="person"){
				var emailAddress =  selection[i].EmailAddress;
				if (emailAddress == appCtxt.getActiveAccount().getEmail()){
					this.contactListSelectBtn.setEnabled(true);
					continue;
				}
				this.contactListSelectBtn.setEnabled(false);
				if(this.groupTreeSelected){
					var groupName = this.groupTreeEvent.items[0]._text;
					var parents = this.groupTreeEvent.items[0].parent;
					if(!parents._origClassName){
						JappixMini.addNewRosterGroupsUsers(emailAddress, groupName, this.createContactTreeView);
					}
				}else{
					JappixMini.addNewRosterGroupsUsers(emailAddress, "General", this.createContactTreeView);
				}
			}else{
				this.addDLGroupMemberToTree(selection[i].EmailAddress);
			}
		}
		//this.createContactTreeView();
	}else{
		this.contactListSelectBtn.setEnabled(true);
	}
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.addDLGroupMemberToTree = function(email){
	var jsonObj = {GetDistributionListMembersRequest:{_jsns:"urn:zimbraAccount", offset:0, limit:10000}};
	var request = jsonObj.GetDistributionListMembersRequest;
	request.dl = {_content: email};
	var result  = appCtxt.getAppController().sendRequest({jsonObj:jsonObj, asyncMode:false});
	var localResponse = result.GetDistributionListMembersResponse;
	if(localResponse!=undefined){
		for(var i=0;i<localResponse.dlm.length;i++){
			console.log(localResponse.dlm[i]._content);
			JappixMini.addNewRosterGroupsUsers(localResponse.dlm[i]._content, email, this.createContactTreeView);
		}
	}
}
biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._contactSearchListener = function() {
	var searchQuery = this.contactSearchField.getValue();
	var soapDoc = AjxSoapDoc.create("SearchGalRequest", "urn:zimbraAccount");
	soapDoc.set("offset", "0");
	soapDoc.set("limit", "10000");
	soapDoc.set("name", searchQuery);
	soapDoc.set("types", "account");
	soapDoc.set("needIsOwner", "1");
	soapDoc.set("needIsMember", "directOnly");
	soapDoc.set("sortBy", "nameAsc");
	var params = {
		soapDoc : soapDoc,
		asyncMode : false
	}
	var result = appCtxt.getAppController().sendRequest(params);
	var localresponse = result.SearchGalResponse.cn;
	var email = "";
	var displayName = "";
	var type = "";
	var currentDomain = appCtxt.getActiveAccount().getEmail().split("@")[1];
	this.searchResultVector = new AjxVector();
	if(localresponse!=undefined){
		for(var i=0;i<localresponse.length;i++){
			var attribute = localresponse[i]._attrs;
			if(attribute.email.split("@")[1]==currentDomain){
				email = attribute.email;
				if(attribute.type){
					type = "group";
					if(attribute.fullName){
						displayName = attribute.fullName;
					}else{
						displayName = "";
					}
				}else{
					type = "person";
					displayName = attribute.fullName;
				}
				this.searchResultVector.add({
					"Type": type,
					"EmailAddress":email,
					"DisplayName": displayName
				});
			}
		}
	}
	this.listview.setUI(null, true);
	this.listview.set(null);
	this.listview.set(this.searchResultVector);
};
biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.NewaddPeopleListener = function() {
    
    if (biz_zcs_vnc_talk_zimlet_isLaunchChatMini.status != 200) {
        msg = appCtxt.getMsgDialog();
        msg.reset();
        msg.setMessage(
            biz_zcs_vnc_talk_zimlet.configuration_not_set,
            DwtMessageDialog.INFO_STYLE
        );
        msg.popup();
        return;
    }
    var roomID;
    if(biz_zcs_vnc_talk_zimlet_HandlerObject.isConferenceRunning()) {
        roomID = biz_zcs_vnc_talk_zimlet_HandlerObject.currentRoomId;
        this._handleKeyUpEvent(biz_zcs_vnc_talk_zimlet_HandlerObject.currentRoomId + '@' + CONFERENCE_DOMAIN);
    }
    JappixMini.openPromptAddPeopleToVideoConference(roomID);

};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.copyToClipboard = function(text, sucCb, errCb) {
    if(!this.inputVideoUrl){
        var treeId = Dwt.getNextId();
        this.inputVideoUrl = new DwtInputField({
        parent: this.getShell(),
        type: DwtInputField.STRING,
        id: "vnc_talk_get_video_url_" + treeId,
        inputId:"input_vnc_talk_get_video_url"
        });
    }
    this.inputVideoUrl.setValue(text);

    if (window.clipboardData && window.clipboardData.setData) {
        if (typeof sucCb == 'function') {sucCb();};
        return clipboardData.setData("Text", text);

    } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
        document.body.appendChild(this.inputVideoUrl.getHtmlElement());
        $("#input_vnc_talk_get_video_url").select();
        var success = true;
        try {
            return document.execCommand("copy");
        } catch (ex) {
            console.warn("Copy to clipboard failed.", ex);
            success = false;
            return false;
        }finally {
            this.inputVideoUrl.setValue("");
            if(success){
                if (typeof sucCb == 'function') {sucCb();};
            }else{
                if (typeof errCb == 'function') {errCb();};
            }
        }
    }else{if (typeof errCb == 'function') {errCb();}}
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.getVideoChatLink = function(){
    var url = JappixMini.generateVideoChatUrl("External-Guest",biz_zcs_vnc_talk_zimlet_HandlerObject.currentRoomId);
    var sucCb = function(){
        var dialog = appCtxt.getMsgDialog();
        dialog.reset();
        dialog.setMessage("Copy VideoChatURL success, Press Ctl+V to paste",
        DwtMessageDialog.INFO_STYLE);
        dialog.setButtonListener(DwtDialog.OK_BUTTON,new AjxListener(this,function(){
            dialog.popdown();
        }));
        dialog.popup();
    };
    var errCb = function(){
        var dialog = appCtxt.getMsgDialog();
        dialog.reset();
        dialog.setMessage("Copy VideoChatURL fail, Your browser is not supported",
        DwtMessageDialog.WARNING_STYLE);
        dialog.setButtonListener(DwtDialog.OK_BUTTON,new AjxListener(this,function(){
            dialog.popdown();
        }));
        dialog.popup();
    };
    this.copyToClipboard(url, sucCb, errCb);
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.addPeopleListener = function() {
	if(JappixMini != undefined){
		JappixMini.hideRoster();
	}

	if (biz_zcs_vnc_talk_zimlet_isLaunchChatMini.status != 200) {
		msg = appCtxt.getMsgDialog();
		msg.reset();
		msg.setMessage(
			biz_zcs_vnc_talk_zimlet.configuration_not_set,
			DwtMessageDialog.INFO_STYLE
		);
		msg.popup();
		return;
	}

  //reset addSubjectDialog if exist
  if (this.addSubjectDialog) {
    this.addSubjectDialog.reset();
  }

	if (!this.addPeopleDialog) {
		random = Dwt.getNextId();
		var dataArray = {
			random: random
		};
		parentViewAddPeople = new DwtComposite(this.getShell());
		parentViewAddPeople.setSize("270", "75");
		parentViewAddPeople.getHtmlElement().innerHTML = AjxTemplate.expand("biz_zcs_vnc_talk_zimlet.templates.biz_zcs_vnc_talk_zimlet_add_people#biz_zcs_vnc_talk_add_people", dataArray);
		this.addPeopleDialog = new ZmDialog({
			title: this.getMessage("addpeople"),
			view: parentViewAddPeople,
			parent: this.getShell(),
			standardButtons: [DwtDialog.OK_BUTTON, DwtDialog.DISMISS_BUTTON]
		});
		this.addPeopleDialog.getButton(DwtDialog.DISMISS_BUTTON).setText(this.getMessage("vnc_talk_close"));
		this.addPeopleDialog.setButtonListener(
			DwtDialog.OK_BUTTON,
			new AjxListener(
				this,
				this._addPeopleDialogOkListener
			)
		);
		this.emailInputField = new DwtInputField({
			parent: this.addPeopleDialog,
			id: "input_add_people" + random,
			inputId:"input_add_people_talk"
		});
		this.emailInputField.setSize("22","22");
		this._handleKeyUpEvent();
		this.subjectInputField = new DwtInputField({
			parent: this.addPeopleDialog,
			id: "input_add_subject" + random,
			inputId:"input_add_people_subject"
		})
		this.emailInputField.setValue("");
		if(biz_zcs_vnc_talk_zimlet_HandlerObject.isInviteMeeting){
			this.subjectInputField.setValue(this.vncMeetingRoomName);
		}else if(biz_zcs_vnc_talk_zimlet_HandlerObject.isMailInviteMeeting){
			this.subjectInputField.setValue(this.mailvncMeetingRoomName);
		}else{
			this.subjectInputField.setValue("");
		}
		biz_zcs_vnc_talk_zimlet_HandlerObject.isMailInviteMeeting = false;
		biz_zcs_vnc_talk_zimlet_HandlerObject.isInviteMeeting = false;

		//Conference is running:
    if(biz_zcs_vnc_talk_zimlet_HandlerObject.isConferenceRunning()) {
        //Add Current roomname
        this.subjectInputField.setValue(biz_zcs_vnc_talk_zimlet_HandlerObject.currentRoomId);
        this._handleKeyUpEvent(biz_zcs_vnc_talk_zimlet_HandlerObject.currentRoomId + '@' + CONFERENCE_DOMAIN);
        //Hide subject field
        var element = parentViewAddPeople.getHtmlElement();
        element.querySelector("table tbody").children[0].style.display = "none";
        element.style.height = 40;
		//close autocomplete when drag dialog
		var dragId = '#'+this.addPeopleDialog._dragHandleId.trim();
	    $(dragId).mousedown(function(){
	    	$("#input_add_people_talk").autocomplete("close");
		});
    }

		document.getElementById("vnc_talk_add_subject" + random).appendChild(
			this.subjectInputField.getHtmlElement()
		);
		document.getElementById("vnc_talk_add_people_email" + random).appendChild(
			this.emailInputField.getHtmlElement()
		);
		this.addPeopleDialog._baseTabGroupSize = 4;
		this.addPeopleDialog._tabGroup.addMember(
			this.subjectInputField,
			0
		);
		this.addPeopleDialog._tabGroup.addMember(
			this.emailInputField,
			1
		);
		this.addPeopleDialog._tabGroup.addMember(
			this.addPeopleDialog.getButton(
				DwtDialog.OK_BUTTON
			),
			2
		);
		this.addPeopleDialog._tabGroup.addMember(
			this.addPeopleDialog.getButton(
				DwtDialog.DISMISS_BUTTON
			),
			3
		);
		//close autocomplete when drag dialog
		var dragId = '#'+this.addPeopleDialog._dragHandleId.trim();
		$(dragId).mousedown(function(){
			$("#input_add_people_talk").autocomplete("close");
		});

	}else{
		if(biz_zcs_vnc_talk_zimlet_HandlerObject.isInviteMeeting){
			this.subjectInputField.setValue(this.vncMeetingRoomName);
		}else if(biz_zcs_vnc_talk_zimlet_HandlerObject.isMailInviteMeeting){
			this.subjectInputField.setValue(this.mailvncMeetingRoomName);
		}else{
			this.subjectInputField.setValue("");
		}
		this.emailInputField.setValue("");
		biz_zcs_vnc_talk_zimlet_HandlerObject.isInviteMeeting = false;
		biz_zcs_vnc_talk_zimlet_HandlerObject.isMailInviteMeeting = false;
    //Conference is running:
    if(biz_zcs_vnc_talk_zimlet_HandlerObject.isConferenceRunning()) {
    		//Add Current roomname
    		this.subjectInputField.setValue(biz_zcs_vnc_talk_zimlet_HandlerObject.currentRoomId);
        this._handleKeyUpEvent(biz_zcs_vnc_talk_zimlet_HandlerObject.currentRoomId + '@' + CONFERENCE_DOMAIN);
    		//Hide subject field
    		var element = parentViewAddPeople.getHtmlElement();
    		element.querySelector("table tbody").children[0].style.display = "none";
    		element.style.height = 40;
			//close autocomplete when drag dialog
			var dragId = '#'+this.addPeopleDialog._dragHandleId.trim();
			$(dragId).mousedown(function(){
			   $("#input_add_people_talk").autocomplete("close");
			});
    } else {
        this._handleKeyUpEvent();
        var element = parentViewAddPeople.getHtmlElement();
        element.querySelector("table tbody").children[0].removeAttribute("style");
        parentViewAddPeople.setSize("270", "75");
		//close autocomplete when drag dialog
		var dragId = '#'+this.addPeopleDialog._dragHandleId.trim();
		$(dragId).mousedown(function(){
		    $("#input_add_people_talk").autocomplete("close");
		});
    }
   }
	this.addPeopleDialog.popup();
};
biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.invitePeopleListener = function() {
        if (biz_zcs_vnc_talk_zimlet_isLaunchChatMini.status != 200) {
                msg = appCtxt.getMsgDialog();
                msg.reset();
                msg.setMessage(
                        biz_zcs_vnc_talk_zimlet.configuration_not_set,
                        DwtMessageDialog.INFO_STYLE
                );
                msg.popup();
                return;
        }
        if (!this.invitePeopleDialog) {
                random = Dwt.getNextId();
                var dataArray = {
                        random: random
                };
                parentView = new DwtComposite(this.getShell());
                parentView.setSize("270", "75");
                parentView.getHtmlElement().innerHTML = AjxTemplate.expand("biz_zcs_vnc_talk_zimlet.templates.biz_zcs_vnc_talk_zimlet_invite_people#biz_zcs_vnc_talk_invite_people", dataArray);
                this.invitePeopleDialog = new ZmDialog({
                        title: this.getMessage("vnc_talk_invite_people"),
                        view: parentView,
                        parent: this.getShell(),
                        standardButtons: [DwtDialog.OK_BUTTON, DwtDialog.DISMISS_BUTTON]
                });
		this.invitePeopleDialog.getButton(DwtDialog.DISMISS_BUTTON).setText(this.getMessage("vnc_talk_close"));
                this.invitePeopleDialog.setButtonListener(
                        DwtDialog.OK_BUTTON,
                        new AjxListener(
                                this,
                                this._invitePeopleDialogOkListener
                        )
                );
                this.emailInput = new DwtInputField({
                        parent: this.invitePeopleDialog,
                        id: "input_invite_people" + random,
                        inputId:"input_invite_people_talk"
                });
                this.emailInput.setSize("22","22");
                this._handleKeyUpEvent(CURRENT_ROOM_XID);
                this.subjectInput = new DwtInputField({
                        parent: this.invitePeopleDialog,
                        id: "input_invite_subject" + random,
                        inputId:"input_invite_people_subject"
                })
                this.emailInput.setValue("");
		if(biz_zcs_vnc_talk_zimlet_HandlerObject.isInviteMeeting){
			this.subjectInput.setValue(this.vncMeetingRoomName);
		}else if(biz_zcs_vnc_talk_zimlet_HandlerObject.isMailInviteMeeting){
			this.subjectInput.setValue(this.mailvncMeetingRoomName);
		}else{
                	this.subjectInput.setValue("");
		}
		biz_zcs_vnc_talk_zimlet_HandlerObject.isInviteMeeting = false;
		biz_zcs_vnc_talk_zimlet_HandlerObject.isMailInviteMeeting = false;
 		document.getElementById("vnc_talk_invite_subject" + random).appendChild(
                        this.subjectInput.getHtmlElement()
                );
                document.getElementById("vnc_talk_invite_people_email" + random).appendChild(
                        this.emailInput.getHtmlElement()
                );
                this.invitePeopleDialog._baseTabGroupSize = 4;
                this.invitePeopleDialog._tabGroup.addMember(
                        this.subjectInput,
                        0
                );
                this.invitePeopleDialog._tabGroup.addMember(
                        this.emailInput,
                        1
                );
                this.invitePeopleDialog._tabGroup.addMember(
                        this.invitePeopleDialog.getButton(
                                DwtDialog.OK_BUTTON
                        ),
                        2
                );
                this.invitePeopleDialog._tabGroup.addMember(
                        this.invitePeopleDialog.getButton(
                                DwtDialog.DISMISS_BUTTON
                        ),
                        3
                );
        }else{
                this._handleKeyUpEvent(CURRENT_ROOM_XID);
                this.emailInput.setValue("");
		if(biz_zcs_vnc_talk_zimlet_HandlerObject.isInviteMeeting){
			this.subjectInput.setValue(this.vncMeetingRoomName);
		}else if(biz_zcs_vnc_talk_zimlet_HandlerObject.isMailInviteMeeting){
			this.subjectInput.setValue(this.mailvncMeetingRoomName);
		}else{
                	this.subjectInput.setValue("");
		}
        }

		//Hide subject field
		var element = parentView.getHtmlElement();
		element.querySelector("table tbody").children[0].style.display = "none";
		element.style.height = 40;
		//close autocomplete when drag dialog
	    var dragId1 = '#'+this.invitePeopleDialog._dragHandleId.trim();
	    $(dragId1).mousedown(function(){
	       $("#input_invite_people_talk").autocomplete("close");
	    });
    this.invitePeopleDialog.popup();
};


biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.sendFileListener = function(xid) {
	var dataArray={
		receiver:xid,
		resource:getResourceList(MINI_XMPP_CLIENTS,xid)
	}
	parentView = new DwtComposite(this.getShell());
	parentView.setSize("270", "75");
	parentView.getHtmlElement().innerHTML = AjxTemplate.expand("biz_zcs_vnc_talk_zimlet.templates.biz_zcs_vnc_talk_zimlet_selectResource_FileTransfer#biz_zcs_vnc_talk_resource_fileTransfer", dataArray);
		this.sendFileDialog = new ZmDialog({
			title: this.getMessage("vnc_talk_invite_people"),
			view: parentView,
			parent: this.getShell(),
			standardButtons: [DwtDialog.OK_BUTTON, DwtDialog.DISMISS_BUTTON]
		});
		this.sendFileDialog.getButton(DwtDialog.DISMISS_BUTTON).setText(this.getMessage("vnc_talk_close"));
		this.sendFileDialog.setButtonListener(
                        DwtDialog.OK_BUTTON,
                        new AjxListener(
                                this,
                                this._sendFileDialogOkListener,
				xid
                        )
                );

	this.sendFileDialog.popup();

};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._sendFileDialogOkListener = function(xid) {
	var resource=$('input[name=resource]:checked').val();
	console.log(xid+"------"+resource);
	this.sendFileDialog.popdown();
	sendFileTransferRequest(xid,resource);
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._handleKeyUpEvent = function(roomID){
	this.handleGalResponse(JappixMini.getAllGALEmailContactObject(), roomID);
};

//filter name in autocomplete
biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.filterName = function(select, listname, roomID) {
  var tmp = [];
  select.pop();
  var current_room = roomID || "";
  //console.log("Current room: ", current_room);
  var members = JappixMini.getAllParticipantName(current_room);
  //console.log("Members: ", members);
  for(var name in listname){
    if(select.indexOf(listname[name].email) == -1 && members.indexOf(listname[name].email) == -1){
        tmp.push(listname[name]);
    }
  }
  return tmp;
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.handleGalResponse = function(result, roomID) {
	this.galResultUsername = new Array();
	this.galResultUsername = result;
				$("#input_add_people_talk").autocomplete({
				delay : 500,
				minLength : 4,
                source: function( request, response ) {
                        var selected = $("#input_add_people_talk").val().split( /;\s*/ );
                        var listName = biz_zcs_vnc_talk_zimlet_this.galResultUsername;
                        var result_filter = biz_zcs_vnc_talk_zimlet_this.filterName(selected, listName, roomID);
                        //response( $.ui.autocomplete.filter(result_filter, request.term.split( /;\s*/ ).pop()));
                        function hasMatch(s) {
                            var _req = request.term.split( /;\s*/ ).pop();
                            return s.toLowerCase().indexOf(_req.toLowerCase())!==-1;
                         }
                         var i, l, obj, matches = [];
                         if (request.term==="" || request.term.split( /;\s*/ ).pop().length < 4) {
                            response([]);
                            return;
                         }
                         for  (i = 0, l = result_filter.length; i<l; i++) {
                            obj = result_filter[i];
                            if (hasMatch(obj.email) || hasMatch(obj.displayName)) {
                              matches.push(obj);
                            }
                         }
                         response(matches);
                },
                select: function( event, ui ) {
                        var terms = this.value.split( /;\s*/ );
                        terms.pop();
                        terms.push( ui.item.email );
                        terms.push( "" );
                        this.value = terms.join( "; " );
                        return false;
                 },
                focus: function() {
                        return false;
                }
        });

				if(jQuery('#input_add_people_talk').length > 0){
            $("#input_add_people_talk").data( "uiAutocomplete" )._renderItem = function( ul, item ) {
                  var icon = biz_zcs_vnc_talk_zimlet_this.addAutocompleteIcon(item);
                  return $( "<li></li>" )
                      .attr( "data-value", item.email )
                      .append( '<a><image src="' + icon + '"/>' + ' "' + item.displayName + '" &lt' + item.email + '&gt' + "</a>" )
                      .appendTo( ul );
            };
        }

        $("#input_invite_people_talk").autocomplete({
				delay : 500,
				minLength : 4,
                source: function( request, response ) {
                        var selected = $("#input_invite_people_talk").val().split( /;\s*/ );
                        var listName = biz_zcs_vnc_talk_zimlet_this.galResultUsername;
                        var result_filter = biz_zcs_vnc_talk_zimlet_this.filterName(selected, listName, roomID);
                        //response( $.ui.autocomplete.filter(result_filter, request.term.split( /;\s*/ ).pop()));
                        function hasMatch(s) {
                            var _req = request.term.split( /;\s*/ ).pop();
                            return s.toLowerCase().indexOf(_req.toLowerCase())!==-1;
                         }
                         var i, l, obj, matches = [];
                         if (request.term==="" || request.term.split( /;\s*/ ).pop().length < 4) {
                            response([]);
                            return;
                         }
                         for  (i = 0, l = result_filter.length; i<l; i++) {
                            obj = result_filter[i];
                            if (hasMatch(obj.email) || hasMatch(obj.displayName)) {
                              matches.push(obj);
                            }
                         }
                         response(matches);
                },
                select: function( event, ui ) {
                        var terms = this.value.split( /;\s*/ );
                        terms.pop();
                        terms.push( ui.item.email );
                        terms.push( "" );
                        this.value = terms.join( "; " );
                        return false;
                 },
                focus: function() {
                        return false;
                }
        });

        if(jQuery('#input_invite_people_talk').length >0){
            $("#input_invite_people_talk").data( "uiAutocomplete" )._renderItem = function( ul, item ) {
                var icon = biz_zcs_vnc_talk_zimlet_this.addAutocompleteIcon(item);
                return $( "<li></li>" )
                    .attr( "data-value", item.email )
                    .append( '<a><image src="' + icon + '"/>' + ' "' + item.displayName + '" &lt' + item.email + '&gt' + "</a>" )
                    .appendTo( ul );
            };
        }

        $("#jappix_input_invite_people_talk").autocomplete({
				delay : 500,
				minLength : 4,
                source: function( request, response ) {
                        var selected = $("#jappix_input_invite_people_talk").val().split( /;\s*/ );
                        var listName = biz_zcs_vnc_talk_zimlet_this.galResultUsername;
                        var result_filter = biz_zcs_vnc_talk_zimlet_this.filterName(selected, listName, roomID);
                        //response( $.ui.autocomplete.filter(result_filter, request.term.split( /;\s*/ ).pop()));
                        function hasMatch(s) {
                            var _req = request.term.split( /;\s*/ ).pop();
                            return s.toLowerCase().indexOf(_req.toLowerCase())!==-1;
                         }
                         var i, l, obj, matches = [];
                         if (request.term==="" || request.term.split( /;\s*/ ).pop().length < 4) {
                            response([]);
                            return;
                         }
                         for  (i = 0, l = result_filter.length; i<l; i++) {
                            obj = result_filter[i];
                            if (hasMatch(obj.email) || hasMatch(obj.displayName)) {
                              matches.push(obj);
                            }
                         }
                         response(matches);
                },
                select: function( event, ui ) {
                        var terms = this.value.split( /;\s*/ );
                        terms.pop();
                        terms.push( ui.item.email );
                        terms.push( "" );
                        this.value = terms.join( "; " );
                        return false;
                 },
                focus: function() {
                        return false;
                },
                open: function() {
                  $(".ui-autocomplete:visible").css({top:"+=5"});
                }
        });

        if(jQuery('#jappix_input_invite_people_talk').length > 0){
            $("#jappix_input_invite_people_talk").data( "uiAutocomplete" )._renderItem = function( ul, item ) {
            var icon = biz_zcs_vnc_talk_zimlet_this.addAutocompleteIcon(item);
            return $( "<li></li>" )
                .attr( "data-value", item.email )
                .append( '<a><image src="' + icon + '"/>' + ' "' + item.displayName + '" &lt' + item.email + '&gt' + "</a>" )
                .appendTo( ul );
            };
        }

        //scroll the result
        $(".ui-autocomplete").css({"max-height": "100px", "overflow-y": "auto", "overflow-x": "hidden"});

};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._handleAddFavorite = function(favorite){
    this.handleFavoriteResponse(JappixMini.getAllGALEmailContactObject(), favorite);
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.handleFavoriteResponse = function(result, favorite) {
  this.galResultUsername = new Array();
  this.galResultUsername = result;
  $("#input_favorite_people_talk").autocomplete({
	delay : 500,
	minLength : 4,
    source: function( request, response ) {
      var selected = $("#input_favorite_people_talk").val().split( /;\s*/ );
      var selected = arrayUnique(favorite.concat(selected));
      var listName = biz_zcs_vnc_talk_zimlet_this.galResultUsername;
      var result_filter = biz_zcs_vnc_talk_zimlet_this.filterName(selected, listName);
      //response( $.ui.autocomplete.filter(result_filter, request.term.split( /;\s*/ ).pop()));
      function hasMatch(s) {
          var _req = request.term.split( /;\s*/ ).pop();
          return s.toLowerCase().indexOf(_req.toLowerCase())!==-1;
       }
       var i, l, obj, matches = [];
       if (request.term==="" || request.term.split( /;\s*/ ).pop().length < 4) {
          response([]);
          return;
       }
       for  (i = 0, l = result_filter.length; i<l; i++) {
          obj = result_filter[i];
          if (hasMatch(obj.email) || hasMatch(obj.displayName)) {
            matches.push(obj);
          }
       }
       response(matches);
    },
    select: function( event, ui ) {
      var terms = this.value.split( /;\s*/ );
      terms.pop();
      terms.push( ui.item.email );
      terms.push( "" );
      this.value = terms.join( "; " );
      return false;
    },
    focus: function() {
      return false;
    }
  });

  if(jQuery('#input_favorite_people_talk').length > 0){
    $("#input_favorite_people_talk").data( "uiAutocomplete" )._renderItem = function( ul, item ) {
      var icon = biz_zcs_vnc_talk_zimlet_this.addAutocompleteIcon(item);
      return $( "<li></li>" )
        .attr( "data-value", item.email )
        .append( '<a><image src="' + icon + '"/>' + ' "' + item.displayName + '" &lt' + item.email + '&gt' + "</a>" )
        .appendTo( ul );
    };
  }

  //scroll the result
  $(".ui-autocomplete").css({"max-height": "100px", "overflow-y": "auto", "overflow-x": "hidden"});
 };

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.addAutocompleteIcon = function(suggestion) {
    if(JappixMini.isExternalGuest(suggestion.value)){
        return biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_URL + "/mini/images/sources/icons/email_go.png";
    }else{
        return biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_URL + "/mini/images/sources/icons/comment_add.png";
    }
};

biz_zcs_vnc_talk_zimlet_HandlerObject.getCurrentDomain = function() {
    return appCtxt.getActiveAccount().getEmail().split("@")[1];
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.launchChatMini = function() {
	if (!biz_zcs_vnc_talk_zimlet_HandlerObject.noConfiguration()) {
		var url_chat_address = biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_URL;
		if (url_chat_address || url_chat_address != "") {
			CHAT_URL_DOMAIN = url_chat_address.substring(url_chat_address.indexOf(":") + 3, url_chat_address.length);
			CHAT_DOMAIN = biz_zcs_vnc_talk_zimlet_HandlerObject.getCurrentDomain();
			CHAT_PORT = biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_PORT;
			SCHEME = url_chat_address.substring(0, url_chat_address.lastIndexOf("//") - 1);
		} else {
			CHAT_DOMAIN = "";
			CHAT_PORT = "";
			SCHEME = "";
		}
		CHAT_USERNAME = biz_zcs_vnc_talk_zimlet_HandlerObject.getCurrentUserName();
		CHAT_USERPASSWORD = biz_zcs_vnc_talk_zimlet_HandlerObject.getVNCChatAuthToken();
		ProsURL = SCHEME + "://" + CHAT_URL_DOMAIN + ":" + CHAT_PORT + "/";
		Mini_nick_name = biz_zcs_vnc_talk_zimlet_HandlerObject.getCurrentUserName();
		jQuery.ajaxSetup({
			cache: false
		});

		return jQuery.getScript("/service/proxy?target=" + AjxStringUtil.urlComponentEncode(ProsURL + "/mini/index.js"),function(){
		    biz_zcs_vnc_talk_zimlet_this.jappixMiniLoaded = true;
		    if(biz_zcs_vnc_talk_zimlet_this.progressDialog && biz_zcs_vnc_talk_zimlet_this.progressDialog.isPoppedUp()){
			biz_zcs_vnc_talk_zimlet_this.progressDialog.popdown();
                    }
		}); //core jappi*/

	}
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.launchMiddleWareLib = function(){
  jQuery.getScript("/service/proxy?target=" + AjxStringUtil.urlComponentEncode(biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_URL + "/middleware_lib.js")).done(function(){
      var callback = function(data) {
          var value = data || "";
          localStorage.setItem('CAPABILITIES', value);

          if(biz_zcs_vnc_talk_zimlet_this.isCapabilitySoftphoneEnabled()){
            biz_zcs_vnc_talk_zimlet_HandlerObject._vncSoftPhoneApp = biz_zcs_vnc_talk_zimlet_this.createApp(
              biz_zcs_vnc_talk_zimlet_this.getMessage("vnc_soft_phone"),
              "zimbra",
              biz_zcs_vnc_talk_zimlet_this.getMessage("vnc_soft_phone")
            );
          }
          console.log("Are talk Capabilities enabled:", biz_zcs_vnc_talk_zimlet_this.capabilitiesEnabled());
          if(biz_zcs_vnc_talk_zimlet_this.capabilitiesEnabled()){
            biz_zcs_vnc_talk_zimlet_isLaunchChatMini = biz_zcs_vnc_talk_zimlet_this.launchChatMini();
          }

      };
      var errCallback = function(data) { console.log("Error: " + data); };
      MiddlewareAPI.getCapabilities(callback, errCallback);
  })
  .fail(function(){console.error("Fail to load Midleware Library, Try to reload your browser again!");});
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.capabilitiesEnabled = function(){
	var local_storage = localStorage.getItem("CAPABILITIES") || null;
	var enabled = false;
	if (local_storage != null && local_storage != "") {
		features = JSON.parse(local_storage).EnabledFeatures;
		if(features != undefined && features.length > 0){
			enabled = true;
		}
	}
	return enabled;
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.isCapabilityEnabled = function(capability){
  var local_storage = localStorage.getItem("CAPABILITIES") || null;
  var enabled = false;
  var features = [];
  if (!capability) {
	  return false;
  }
  if (local_storage != null && local_storage != "") {
      features = JSON.parse(local_storage).EnabledFeatures;
      if(features.indexOf(capability) != -1){
        enabled = true;
      }
  }
  return enabled;
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.isCapabilityVideoEnabled = function(){
  var capability = "vncTalk.video";
  return this.isCapabilityEnabled(capability);
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.isCapabilityExternalGuestInvitationEnabled = function(){
  var capability = "vncTalk.externalGuestInvitation";
  return this.isCapabilityEnabled(capability);
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.isCapabilitySingleTextChatEnabled = function(){
  var capability = "vncTalk.singleTextChat";
  return this.isCapabilityEnabled(capability);
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.isCapabilityGroupTextChatEnabled = function(){
  var capability = "vncTalk.groupTextChat";
  return this.isCapabilityEnabled(capability);
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.isCapabilityFileTransferEnabled = function(){
  var capability = "vncTalk.fileTransfer";
  return this.isCapabilityEnabled(capability);
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.isCapabilityDocumentCollaborationEnabled = function(){
  var capability = "vncTalk.documentCollaboration";
  return this.isCapabilityEnabled(capability);
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.isCapabilitySoftphoneEnabled = function(){
  var capability = "vncTalk.softphone";
  return this.isCapabilityEnabled(capability);
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.isCapabilityScreenshareEnabled = function(){
  var capability = "vncTalk.screenshare";
  return this.isCapabilityEnabled(capability);
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.doubleClicked = function() {
	this.singleClicked();
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.singleClicked = function() {
	JappixMini.blockJappix();
	//this.random = Dwt.getNextId();
	if(!this.chattabView){
	  var chatview = new DwtComposite(appCtxt.getShell());
	  this.chattabView = new DwtTabView(chatview, "SideStepTabView");
	  this.chataboutus = new biz_zcs_vnc_talk_zimlet_aboutus(this.chattabView, this);
	  this.chatconfiguration = new biz_zcs_vnc_talk_zimlet_configurationTab(this.chattabView,this);
	  chatview.setSize("400px", "320px");
	  this.chattabView.setSize("400px", "330px");
	  this.chattabView.addTab(this.getMessage("tab_configuration"), this.chatconfiguration);
	  this.chattabView.addTab(this.getMessage("tab_aboutus"), this.chataboutus);
	  this.chatdlg = new ZmDialog({
		title: this.getMessage("configuration_Auth"),
		view: chatview,
		parent: this.getShell(),
		standardButtons: [DwtDialog.DISMISS_BUTTON, DwtDialog.OK_BUTTON]
	  });
	  this.chatdlg.getButton(DwtDialog.DISMISS_BUTTON).setText(this.getMessage("vnc_talk_close"));
	  this.chatdlg.setButtonListener(
		DwtDialog.DISMISS_BUTTON,
		new AjxListener(
			this,
			this._chatDismissBtnListener,
			this.random
		)
	  );
	  this.chatdlg.setButtonListener(
			DwtDialog.OK_BUTTON,
			new AjxListener(
				this,
				this._chatOkBtnListener,
				this.random
                )
          );
	  this.chatdlg._tabGroup.removeAllMembers();
	  this.chatdlg._baseTabGroupSize = 12;
	  this.chatdlg._tabGroup.__blockApplicationHandling = false;
	  this.chatdlg._tabGroup.__blockDefaultHandling = false;
	  this.chatdlg._tabGroup.addMember(
		this.chatdlg.getButton(
			DwtDialog.DISMISS_BUTTON
		),
		8
	  );

	  this.chatdlg._tabGroup.addMember(document.getElementById("isMiniAutoLogin_" + this.random), 0);
          this.chatdlg._tabGroup.addMember(document.getElementById("vnctalk_available_priority_" + this.random), 2);
          this.chatdlg._tabGroup.addMember(document.getElementById("vnctalk_away_priority_" + this.random), 3);
          this.chatdlg._tabGroup.addMember(this.chatdlg.getButton(DwtDialog.DISMISS_BUTTON),4);
    	  this.chatdlg._tabGroup.addMember(this.chatdlg.getButton(DwtDialog.OK_BUTTON),6);
    	  this.list_input = this.chatdlg.getHtmlElement().getElementsByTagName("input");
    	  for(var i=0;i<this.list_input.length;i++){
            if(i == this.list_input.length -1){
              jQuery(this.list_input[i]).keydown(function(e){
                if(e.keyCode == 9){
                    jQuery(biz_zcs_vnc_talk_zimlet_this.list_input[0]).focus();
                }
              });
            }else{
              jQuery(this.list_input[i]).keydown(function(e){
                if(e.keyCode == 9){
                    jQuery(biz_zcs_vnc_talk_zimlet_this.list_input[i+1]).focus();
                }
              });
            }
          }
        }
        //get priority config from Middleware
	MiddlewareAPI.getAllUserPreferences(function(res){
	  if(res['settings::xmpp::available_priority']){
	      chatFlag = res['settings::start_vnctalk_automatically'];
	      if(chatFlag == "true"){
	          document.getElementById("isMiniAutoLogin_"+biz_zcs_vnc_talk_zimlet_this.random).checked=true;
	          biz_zcs_vnc_talk_zimlet_this.isMiniAutoLogin = "true";
	      }else{
	          document.getElementById("isMiniAutoLogin_"+biz_zcs_vnc_talk_zimlet_this.random).checked=false;
	          biz_zcs_vnc_talk_zimlet_this.isMiniAutoLogin = "false";
	      }
	  }else{
	      document.getElementById("isMiniAutoLogin_"+biz_zcs_vnc_talk_zimlet_this.random).checked=true;
	  }
	  if(res['settings::xmpp::available_priority']){
	      document.getElementById("vnctalk_available_priority_" + biz_zcs_vnc_talk_zimlet_this.random).value = res['settings::xmpp::available_priority'];
	      biz_zcs_vnc_talk_zimlet_this.available_priority = res['settings::xmpp::available_priority'];
	  }else{
	      document.getElementById("vnctalk_available_priority_" + biz_zcs_vnc_talk_zimlet_this.random).value = 0;
	  }
	  if(res['settings::xmpp::away_priority']){
	      document.getElementById("vnctalk_away_priority_" + biz_zcs_vnc_talk_zimlet_this.random).value = res['settings::xmpp::away_priority'];
	      biz_zcs_vnc_talk_zimlet_this.away_priority = res['settings::xmpp::away_priority'];
	  }else{
	      document.getElementById("vnctalk_away_priority_" + biz_zcs_vnc_talk_zimlet_this.random).value = 0;
	  }
		biz_zcs_vnc_talk_zimlet_this.chattabView.switchToTab(1);
	  biz_zcs_vnc_talk_zimlet_this.chatdlg.popup();
	});
};


biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._chatDismissBtnListener = function(random) {
	this.chatdlg.popdown();
	JappixMini.unblockJappix();
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._chatOkBtnListener = function(random) {
    JappixMini.unblockJappix();
    var isLogin=document.getElementById("isMiniAutoLogin_"+random);
        oldChatFlag = biz_zcs_vnc_talk_zimlet_this.isMiniAutoLogin;
        oldAvaiPr = biz_zcs_vnc_talk_zimlet_this.available_priority;
        oldAwayPr = biz_zcs_vnc_talk_zimlet_this.away_priority;
    var paramFlag = document.getElementById("isMiniAutoLogin_"+random).checked.toString();
    var paramAvailPriority = document.getElementById("vnctalk_available_priority_"+random).value;
    if (paramAvailPriority.charAt(0)=="+"){
            paramAvailPriority = paramAvailPriority.substring(1);
        }
    paramAvailPriority = paramAvailPriority == ""?"0":paramAvailPriority;
    var paramAwayPriority = document.getElementById("vnctalk_away_priority_"+random).value;
    if (paramAwayPriority.charAt(0)=="+"){
            paramAwayPriority = paramAwayPriority.substring(1);
        }
    paramAwayPriority = paramAwayPriority == ""?"0":paramAwayPriority;

  if(!this.verifyPriority(paramAvailPriority) || !this.verifyPriority(paramAwayPriority)){
        var err_msg = biz_zcs_vnc_talk_zimlet.vnc_talk_invalid_priority;
        var err_dialog = appCtxt.getMsgDialog();
        err_dialog.reset();
        err_dialog.setMessage(err_msg, DwtMessageDialog.CRITICAL_STYLE);
        err_dialog.setTitle("Error");
        err_dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, function () {
            err_dialog.popdown();
        }));
        err_dialog.popup();
        return;
    }else{
        if (paramFlag && paramAvailPriority && paramAwayPriority){
            if(oldChatFlag != paramFlag){
                if(isLogin.checked){
                    biz_zcs_vnc_talk_zimlet_this.isMiniAutoLogin = MINI_AUTOCONNECT =  true;
                    if(!JappixCommon.isConnected()){
                        JappixMini.connect(CHAT_DOMAIN, CHAT_USERNAME, CHAT_USERPASSWORD);
                    }
                }else{
                    biz_zcs_vnc_talk_zimlet_this.isMiniAutoLogin = MINI_AUTOCONNECT = false;
                    JappixMini.disconnect();
                }
                MiddlewareAPI.putUserPreference("settings::start_vnctalk_automatically",paramFlag.toString());
            }
            if (paramAvailPriority != oldAvaiPr){
                biz_zcs_vnc_talk_zimlet_this.available_priority = MINI_AVAI_PRIORITY = paramAvailPriority;
                JappixMini.presence('', '', MINI_AVAI_PRIORITY, '', '');
                MiddlewareAPI.putUserPreference("settings::xmpp::available_priority",paramAvailPriority);
            }
            if (paramAwayPriority != oldAwayPr){
                biz_zcs_vnc_talk_zimlet_this.away_priority =  MINI_AWAY_PRIORITY = paramAwayPriority;
                MiddlewareAPI.putUserPreference("settings::xmpp::away_priority",paramAwayPriority);
            }
            appCtxt.getAppController().setStatusMsg(biz_zcs_vnc_talk_zimlet.talk_authstore);

        }
    }
    this.chatdlg.popdown();
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.getSessionID = function(prefName,data){
    var user = appCtxt.getActiveAccount().getEmail();
    var xmlhttp=new XMLHttpRequest();
    var MIDDLEWARE_URL="/VNCMiddleware/rest/account/login";
    var MIDDLEWARE_PARAMS="?";
    var reqURI=MIDDLEWARE_URL+MIDDLEWARE_PARAMS;
    var RESPONSE="";
    var SESSION_ID="";
    xmlhttp.open("POST",reqURI,true);
    xmlhttp.setRequestHeader("Content-type","application/json");
    xmlhttp.onreadystatechange=function() {
        if (xmlhttp.readyState===4){
            if (xmlhttp.status === 200){
                RESPONSE = JSON.parse(xmlhttp.responseText);
                if (RESPONSE.status === 200){
                    SESSION_ID = RESPONSE['result']['SessionId'];
                    console.log("SESSION_ID", SESSION_ID);
                    biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.putSettingMiddleware(SESSION_ID,prefName,data);
                } else {
                window.alert("Zimbra user login failed. Please re-login");
                }
            } else {
                console.log(xmlhttp.responseText);
                window.alert("Your middleware can not be installed/configured properly");
            }
        }
    }
    var datareq = '{ UserName: "' + user + '"}';
    xmlhttp.send(datareq);
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.putSettingMiddleware = function(sessionID,prefName,data){
    var appName="vnctalk";
    var xmlhttp=new XMLHttpRequest();
    var MIDDLEWARE_URL="/VNCMiddleware/rest/appPrefs/user/" + appName + "/" + prefName;
    var MIDDLEWARE_PARAMS="";
    var reqURI=MIDDLEWARE_URL+MIDDLEWARE_PARAMS;
    var RESPONSE="";
    xmlhttp.open("PUT",reqURI,true);
    xmlhttp.setRequestHeader("X-VNC-Auth",sessionID);
    xmlhttp.setRequestHeader("Content-type","application/octet-stream");
    xmlhttp.setRequestHeader("Accept","application/octet-stream, application/json, text/plain, text/html");
    xmlhttp.onreadystatechange=function() {
        if (xmlhttp.readyState===4) {
            if (xmlhttp.status === 200) {
                console.log("PUT: OK");
            } else {
                RESPONSE = JSON.parse(xmlhttp.responseText);
                console.log(xmlhttp.responseText);
            }
        }
    }
    xmlhttp.send(data);
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.verifyPriority = function(pri){
    if(/^(\-)?\d+$/.test(pri)){
        var Num_pri = parseFloat(pri);
        return (typeof Num_pri === 'number') && (Num_pri % 1 === 0) && (Num_pri >= -128) && (Num_pri <= 127);
    }else{
        return false;
    }
};

// ===================================== Tooltip begins ==================================

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype.onEmailHoverOver = function(emailZimlet) {
	emailZimlet.addSubscriberZimlet(this, false);
	this.emailZimlet = emailZimlet;
	this._addVideoSlide();
	biz_zcs_vnc_talk_zimlet.otherParty = this.emailZimlet.emailAddress.substring(
		0,
		this.emailZimlet.emailAddress.indexOf("@")
	);
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._addVideoSlide = function() {
	var controller = appCtxt.getCurrentController();
	var app = appCtxt.getCurrentApp();
	var tthtml = this._getVideoTooltipBGHtml();
	var selectCallback = new AjxCallback(this, this._handleTooltipClick);
	this._slide = new EmailToolTipSlide(
		tthtml,
		true,
		"Vncchaticon",
		selectCallback,
		biz_zcs_vnc_talk_zimlet.panel_label
	);
	this.emailZimlet.slideShow.addSlide(this._slide);
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._getVideoTooltipBGHtml = function() {
	return AjxTemplate.expand("biz_zcs_vnc_talk_zimlet.templates.biz_zcs_vnc_talk_zimlet_hover_over#bg_hover_over");
};

biz_zcs_vnc_talk_zimlet_HandlerObject.incomingPostMessage = function(event) {
	var data = event.data;
	var key = data.key;
	var value = data.value;
	if (key == "roomnode") {
		biz_zcs_vnc_talk_zimlet_HandlerObject.currentRoomId = value;
		biz_zcs_vnc_talk_zimlet_HandlerObject.sendVideoChatInvitation();
	} else if (key == "briefcaseupload") {
		if (biz_zcs_vnc_talk_zimlet_HandlerObject.callInitiator == false) {
			msg = appCtxt.getMsgDialog();
			msg.reset();
			msg.setMessage(
				biz_zcs_vnc_talk_zimlet.screenshotNotAllowed,
				DwtMessageDialog.INFO_STYLE
			);
			msg.popup();
			return;
		}
		var binary = atob(value);
		var ary = [];
		for (var i = 0; i < binary.length; i++) {
			ary.push(binary.charCodeAt(i));
		}
		var fileName = data.filename+"_" + new Date().getTime() + ".jpeg";
		var file = new Blob([new Uint8Array(ary)], {
			type: 'image/jpeg'
		});
		var formData = new FormData();
		formData.append("filename", file, fileName);
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("POST", "/home/~/Briefcase/" + fileName);
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState != 4) return;
			appCtxt.setStatusMsg(biz_zcs_vnc_talk_zimlet.briefcaseUpload);
		};
		xmlhttp.send(formData);
	} else if (key == "disconnect") {
		document.getElementById("vncTalkAppTabiFrame").src = "about:blank";
	}
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._handleTooltipClick = function() {
	if (biz_zcs_vnc_talk_zimlet_HandlerObject.noConfiguration()) {
		return;
	}
	//if(!biz_zcs_vnc_talk_zimlet_HandlerObject.isBrowserGoogleCrome()){
	//	biz_zcs_vnc_talk_zimlet_HandlerObject.browserErrorMessage();
	//	return
	//}
	if (biz_zcs_vnc_talk_zimlet_isLaunchChatMini.status != 200) {
		msg = appCtxt.getMsgDialog();
		msg.reset();
		msg.setMessage(
			biz_zcs_vnc_talk_zimlet.configuration_not_set,
			DwtMessageDialog.INFO_STYLE
		);
		msg.popup();
		return;
	}
  JappixMini.getAllAvailableChatrooms(JappixMini.openPromptSuggestGroupChat);
}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._handleSubjectDismiss = function(controller, app) {
		this.subjectOfMeetingInputField.setValue("");
		this.addSubjectDialog.popdown();
	}

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._handleSubjectOk = function(controller, app) {
	if (controller != null && app != null) {
		biz_zcs_vnc_talk_zimlet.meetingTopic = this.subjectOfMeetingInputField.getValue();
		//this.addSubjectDialog.popdown();
	}
	//if(!biz_zcs_vnc_talk_zimlet_HandlerObject.isBrowserGoogleCrome()){
	//	biz_zcs_vnc_talk_zimlet_HandlerObject.browserErrorMessage();
	//	return;
	//}
	if(this.subjectOfMeetingInputField.getValue() == ""){
                var msg =  appCtxt.getMsgDialog();
                msg.setMessage(this.getMessage("talk_msg_subject_blank"),DwtMessageDialog.WARNING_STYLE);
                msg.popup();
                return;
        }
	//this.subjectOfMeetingInputField.setValue("");
	biz_zcs_vnc_talk_zimlet_HandlerObject.callInitiator = true;
	var roomID = biz_zcs_vnc_talk_zimlet_HandlerObject.currentRoomId || this.checkValidSubject(this.subjectOfMeetingInputField.getValue());
  if(!roomID){
        return;
    }
	if(biz_zcs_vnc_talk_zimlet_HandlerObject.isConferenceRunning()){
		isConfRunning = true;
        }else{
		isConfRunning = false;
	}
	JappixMini.sendGroupVideoConferenceInvitation([biz_zcs_vnc_talk_zimlet.otherParty],roomID,isConfRunning);
	appCtxt.setStatusMsg(biz_zcs_vnc_talk_zimlet.invitationsent);
	this.addSubjectDialog.popdown();
};

biz_zcs_vnc_talk_zimlet_HandlerObject.videoChatDismiss = function() {
	var iframes = document.getElementsByName("chatiframe");
	for (var i = 0; i < iframes.length; i++) {
		iframes[i].contentWindow.postMessage("close", "*");
		iframes[i].src = "";
	}
	if (biz_zcs_vnc_talk_zimlet_HandlerObject.viewDocumentDialog) {
		biz_zcs_vnc_talk_zimlet_HandlerObject.viewDocumentDialog.popdown();
	}
};

biz_zcs_vnc_talk_zimlet_HandlerObject.sendVideoChatInvitation = function(roomID,isConfRunning) {
        var invitationMail = biz_zcs_vnc_talk_zimlet.otherParty.split(";");
        var invitationList = [];
	var isValidInvitee = true;
        for(var i=0;i<invitationMail.length;i++){
                    var invitePerson = AjxStringUtil.trim(invitationMail[i]);
                    if(invitePerson != ""){
                            invitationList.push(invitePerson);
                    }
        }
        var meeting_Subject=biz_zcs_vnc_talk_zimlet.meetingTopic;
	var me = appCtxt.getActiveAccount().getEmail().split("@")[0];
  var my_email = appCtxt.getActiveAccount().getEmail();
        if (invitationList.indexOf(me) != -1 || invitationList.indexOf(my_email) != -1){
                isValidInvitee = false;
        }
        if(!isValidInvitee){
                var msg= biz_zcs_vnc_talk_zimlet.vnc_talk_invalid_video_chat_request;
                var dialog = appCtxt.getMsgDialog(); // get a simple message dialog
                dialog.reset(); // reset the dialog
                dialog.setMessage(msg, DwtMessageDialog.INFO_STYLE); // set the message "info" style
                dialog.popup();
        }else{
      //NEW DESIGN !!!
            //biz_zcs_vnc_talk_zimlet_this.addPeopleDialog.popdown();
            setTimeout(JappixMini.sendGroupVideoConferenceInvitation(invitationList,roomID,isConfRunning),2000);
        }

};


biz_zcs_vnc_talk_zimlet_HandlerObject.getCurrentUserName = function() {
	return appCtxt.getActiveAccount().getEmail().split("@")[0];
};

biz_zcs_vnc_talk_zimlet_HandlerObject.getVNCChatAuthToken = function() {
	response = AjxRpc.invoke("", "/service/zimlet/biz_zcs_vnc_talk_zimlet/zcsvnctalkzimletgetsecret.jsp");
	if (response.success == true) {
		return AjxStringUtil.trim(response.text);
	}
	return "";
};


biz_zcs_vnc_talk_zimlet_HandlerObject.unloadDocument = function() {
	jQuery(window).unload(function() {
	JappixMini.saveSession();
	if(biz_zcs_vnc_talk_zimlet_HandlerObject.isConferenceRunning()){
			biz_zcs_vnc_talk_zimlet_HandlerObject.currentRoomId = null;
			var iframes = document.getElementsByName("vncTalkAppTabiFrame");
			for (var i = 0; i < iframes.length; i++) {
			iframes[i].contentWindow.postMessage({key:"disconnect",value:""},"*");
			iframes[i].src = "about:blank";
			JappixMini.removeIconFromMinimizedWindow();
			}
	}
	});
}

biz_zcs_vnc_talk_zimlet_HandlerObject.readGlobalParameters = function() {
	response = AjxRpc.invoke("", "/service/zimlet/biz_zcs_vnc_talk_zimlet/bizvnctalkzimletgetconfig.jsp");
	if (response.success == true) {
		responseJson = jsonParse(AjxStringUtil.trim(response.text));
		if (null == responseJson["xmpp_url"] || null ==responseJson["xmpp_port"] || null ==responseJson["xmpp_token"] || null == responseJson["xmpp_external_user"] || null == responseJson["xmpp_external_user_port"] || null ==responseJson["xmpp_etherpad_url"] || null ==responseJson["xmpp_etherpad_port"]) {
			appCtxt.getAppController().setStatusMsg(biz_zcs_vnc_talk_zimlet.configuration_not_set, ZmStatusView.LEVEL_CRITICAL);
			biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_URL = biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_PORT = biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_EXTERNAL_USER = biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_EXTERNAL_USER_PORT = null;
			biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_ETHERPAD_URL= biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_ETHERPAD_PORT=biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_TOKEN  = null;
		} else {
			biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_URL = responseJson["xmpp_url"];
			biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_PORT = responseJson["xmpp_port"];
			biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_EXTERNAL_USER = responseJson["xmpp_external_user"];
			biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_EXTERNAL_USER_PORT = responseJson["xmpp_external_user_port"];
			biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_ETHERPAD_URL  = responseJson["xmpp_etherpad_url"];
			biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_ETHERPAD_PORT = responseJson["xmpp_etherpad_port"];
			biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_TOKEN = responseJson["xmpp_token"];
		};

		biz_zcs_vnc_talk_zimlet_HandlerObject.SIP_MAILBOX = responseJson["sip_mailbox"];
		biz_zcs_vnc_talk_zimlet_HandlerObject.SIP_PROXY = responseJson["sip_proxy"];
		biz_zcs_vnc_talk_zimlet_HandlerObject.SIP_REGISTAR = responseJson["sip_registar"];
		biz_zcs_vnc_talk_zimlet_HandlerObject.SIP_REGISTAR_PORT = responseJson["sip_registar_port"];
		biz_zcs_vnc_talk_zimlet_HandlerObject.SIP_SOFTPHONE_OTHER_CONFIG  = responseJson["sip_softphone_other_config"];
		biz_zcs_vnc_talk_zimlet_HandlerObject.SIP_SOFTPHONE_URL = responseJson["sip_softphone_url"];
		biz_zcs_vnc_talk_zimlet_HandlerObject.SIP_SOFTPHONE_WEBRTC2SIP_URL = responseJson["sip_softphone_webrtc2sip_url"];
		biz_zcs_vnc_talk_zimlet_HandlerObject.SIP_TRANSFER = responseJson["sip_transfer"];

		biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_JITSI_AUTH = responseJson["xmpp_jitsi_auth_domain_prefix"];
		biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_JITSI_FOCUS = responseJson["xmpp_jitsi_focus_domain_prefix"];
		biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_JITSI_VIDEOBRIDGE = responseJson["xmpp_jitsi_videobridge_domain_prefix"];
		biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_EXTERNAL_DOMAIN = responseJson["xmpp_external_domain_prefix"];
		biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_CONFERENCE_DOMAIN  = responseJson["xmpp_conference_domain_prefix"];

		biz_zcs_vnc_talk_zimlet_HandlerObject.GLOBAL_XMPP_JITSI_AUTH = responseJson["global_advanced_xmpp_jitsi_auth_domain"];
		biz_zcs_vnc_talk_zimlet_HandlerObject.GLOBAL_XMPP_JITSI_FOCUS = responseJson["global_advanced_xmpp_jitsi_focus_domain"];
		biz_zcs_vnc_talk_zimlet_HandlerObject.GLOBAL_XMPP_JITSI_VIDEOBRIDGE = responseJson["global_advanced_xmpp_jitsi_videobridge_domain"];
		biz_zcs_vnc_talk_zimlet_HandlerObject.GLOBAL_XMPP_EXTERNAL_DOMAIN = responseJson["global_advanced_xmpp_external_domain"];
		biz_zcs_vnc_talk_zimlet_HandlerObject.GLOBAL_XMPP_CONFERENCE_DOMAIN  = responseJson["global_advanced_xmpp_conference_domain"];
		biz_zcs_vnc_talk_zimlet_HandlerObject.GLOBAL_MIDDLEWARE_URL = responseJson["global_advanced_middleware_url"];
		biz_zcs_vnc_talk_zimlet_HandlerObject.GLOBAL_INTERNAL_JITSI_MEET_URL = responseJson["global_advanced_int_jitsi_meet_url"];
		biz_zcs_vnc_talk_zimlet_HandlerObject.GLOBAL_EXTERNAL_JITSI_MEET_URL = responseJson["global_advanced_ext_jitsi_meet_url"];
	} else {
		appCtxt.getAppController().setStatusMsg(biz_zcs_vnc_talk_zimlet.configuration_not_set, ZmStatusView.LEVEL_CRITICAL);
	}
};

biz_zcs_vnc_talk_zimlet_HandlerObject.noConfiguration = function(displayMessage) {
	if (biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_URL == null ||
		biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_PORT == null ||
		biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_EXTERNAL_USER == null ||
		biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_EXTERNAL_USER_PORT == null ||
		biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_ETHERPAD_URL  == null ||
		biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_ETHERPAD_PORT == null ||
		biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_TOKEN == null ) {
		if(displayMessage){
			appCtxt.getAppController().setStatusMsg(biz_zcs_vnc_talk_zimlet.configuration_not_set, ZmStatusView.LEVEL_CRITICAL);
		}
		return true;
	} else {
		return false;
	}
};

biz_zcs_vnc_talk_zimlet_HandlerObject.joinConference = function(roomid) {
	if (biz_zcs_vnc_talk_zimlet_HandlerObject.noConfiguration() || !biz_zcs_vnc_talk_zimlet_this.isCapabilityVideoEnabled()) {
		return;
	}
	biz_zcs_vnc_talk_zimlet_HandlerObject.callInitiator = false;
	biz_zcs_vnc_talk_zimlet_HandlerObject.currentRoomId = roomid;
	if(!AjxEnv.isIE){
		window.addEventListener("message", biz_zcs_vnc_talk_zimlet_HandlerObject.incomingPostMessage, false);
	}else{
		window.attachEvent("message", biz_zcs_vnc_talk_zimlet_HandlerObject.incomingPostMessage);
	}
	var zimlet = appCtxt.getZimletMgr().getZimletByName("biz_zcs_vnc_talk_zimlet");
	var host = window.location.protocol + "//" + window.location.host;
	var app = appCtxt.getApp(biz_zcs_vnc_talk_zimlet_HandlerObject._vncChatApp);
	if (!app.isActive()) {
		app.activate(true);
	}
	appCtxt.getCurrentApp().pushView(biz_zcs_vnc_talk_zimlet_HandlerObject._vncChatApp);
	var videoChatFrame = document.getElementById("vncTalkAppTabiFrame");
	var handlerObject = appCtxt.getZimletMgr().getZimletByName("biz_zcs_vnc_talk_zimlet").handlerObject;
	var nopeopleinvited = document.getElementById("vnctalknopeopleinvited");
	if(nopeopleinvited !=null){
		nopeopleinvited.parentNode.removeChild(nopeopleinvited);
	}
	if (videoChatFrame) {
        uname=AjxStringUtil.urlComponentEncode(biz_zcs_vnc_talk_zimlet_HandlerObject.getCurrentUserName())+'@'+ CHAT_DOMAIN;
        var jitsimeetURL=biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_URL + ":" + biz_zcs_vnc_talk_zimlet_HandlerObject.XMPP_PORT + "/vnctalk-jitsi-meet/vnctalk.html";
        if(biz_zcs_vnc_talk_zimlet_HandlerObject.GLOBAL_INTERNAL_JITSI_MEET_URL!=null){
            jitsimeetURL = biz_zcs_vnc_talk_zimlet_HandlerObject.GLOBAL_INTERNAL_JITSI_MEET_URL;
        }
        videoChatFrame.src = jitsimeetURL + "?login=true&use_login=true&r="+roomid+"&username="+ uname+"&password="+ biz_zcs_vnc_talk_zimlet_HandlerObject.getVNCChatAuthToken()+"&lang="+AjxEnv.DEFAULT_LOCALE;
        videoChatFrame.setAttribute('allowFullScreen', '');
    }
	biz_zcs_vnc_talk_zimlet_this.button.setVisible(true);
	biz_zcs_vnc_talk_zimlet_this.chatDisconnect.setVisible(true);
  biz_zcs_vnc_talk_zimlet_this.getUrlBtn.setVisible(true);
	biz_zcs_vnc_talk_zimlet_this.tabNewVideoConference.setEnabled(false);
  biz_zcs_vnc_talk_zimlet_this.menuJoinVideo.setEnabled(false);
	JappixMini.switchPane();
	JappixMini.colorsizedChattab(roomid);
	JappixMini.createJappixNotification('active_video_conference');
};

biz_zcs_vnc_talk_zimlet_HandlerObject.rejectConference = function(fromaddress){
	var userId = appCtxt.getActiveAccount().getEmail();
	var soapDoc = AjxSoapDoc.create("SendMsgRequest", "urn:zimbraMail");
	var m = soapDoc.set("m");
	m.setAttribute("idnt", userId);
	var node_e = soapDoc.set("e", null, m);
	node_e.setAttribute("p", "");
	node_e.setAttribute("a", fromaddress);
	node_e.setAttribute("t", "t");
	var node_s = soapDoc.set("su", biz_zcs_vnc_talk_zimlet.mail_invitation_reject_subject, m);
	var node = soapDoc.set("mp", null, m);
	node.setAttribute("ct", "text/html");
	var subnode = soapDoc.set(
		"content",
		biz_zcs_vnc_talk_zimlet.mail_hello +","+"<br><br>"+biz_zcs_vnc_talk_zimlet.mail_invitation_reject_body + " "+userId ,
		node
	);
	var params = {
		soapDoc: soapDoc,
		asyncMode: false
	}
	appCtxt.getAppController().sendRequest(params);
	appCtxt.setStatusMsg(biz_zcs_vnc_talk_zimlet.talk_invitation_rejct);
};

biz_zcs_vnc_talk_zimlet_HandlerObject.prototype._getHtmlContent = function(html, idx, content, context) {
	var roomid = AjxStringUtil.trim(content.split("::")[0].split(":")[1]);
	var fromadd = AjxStringUtil.trim(content.split("::")[1].split("##")[0]);
	var dataArray = {
		roomId: roomid,
		fromaddress:fromadd
	};
	html[idx++] = AjxTemplate.expand("biz_zcs_vnc_talk_zimlet.templates.biz_zcs_vnc_talk_zimlet_joinconference#join_conference", dataArray);
	return idx;
};

function createRoomFromLeftSidePanel(callback) {
	console.log("createRoomFromLeftSidePanel");
	typeof callback === 'function' && callback(null);
}

function inviteToGroupchatFromLeftSidePanel(callback) {
	console.log("inviteToGroupchatFromLeftSidePanel");
	typeof callback === 'function' && callback(null);
}

function startVideoconferenceFromLeftSidePanel(callback) {
	console.log("startVideoconferenceFromLeftSidePanel");
	typeof callback === 'function' && callback(null);
}

function inviteToVideoconferenceFromLeftSidePanel(callback) {
	console.log("inviteToVideoconferenceFromLeftSidePanel");
	typeof callback === 'function' && callback(null);
}

function joinVideoconferenceFromLeftSidePanel(callback) {
	console.log("joinVideoconferenceFromLeftSidePanel");
	typeof callback === 'function' && callback(null);
}

function arrayUnique(array) {
  var a = array.concat();
  for(var i=0; i<a.length; ++i) {
    for(var j=i+1; j<a.length; ++j) {
      if(a[i] === a[j]) a.splice(j--, 1);
    }
  }
  return a;
};

function addContactToFavoriteFromLeftSidePanel() {
	console.log("addContactToFavoriteFromLeftSidePanel");
  var username = biz_zcs_vnc_talk_zimlet_this.emailInput.getValue();
  var inValidUser =  [];
  var validUser = [];
  if (username.indexOf(';') == -1) {
      username = [username];
  } else {
      username = username.split(';');
  }
  for(var i=0; i < username.length; i++ ){
      if(username[i] && username[i] != ""){
          if(JappixMini.checkEmail(username[i].trim())){
              validUser.push(username[i].trim());
          }else{
              inValidUser.push(username[i].trim());
          }
      }
  }
  if(inValidUser.length > 0){
    console.log('inValidUser\n', inValidUser);
    var content = "Following are invalid email. Please correct it.<br/>";
    for(var i=0; i<inValidUser.length; i++){
       content = content + inValidUser[i]+"<br/>";
    }
    var msg =  appCtxt.getMsgDialog();
    msg.setMessage(content,DwtMessageDialog.WARNING_STYLE);
    msg.popup();
  }else{
      console.log("Update new favorite-list:", validUser);
      for(var j=0; j < validUser.length; j++){
          JappixMini.addContactToFavorites(validUser[j], handleAddContactToFavoriteFromLeftSidePanel);
      }
      biz_zcs_vnc_talk_zimlet_this.addFavoriteDialog.popdown();
  }
}

function deleteContactToFavoriteFromLeftSidePanel(jid) {
  var successCb = function(){
    appCtxt.setStatusMsg("Favorite contact have been deleted.");
  };
  var errorCb = function(){
    appCtxt.setStatusMsg("Fail to delete favorite contact.");
  };
  JappixMini.deleteContactFromFavorites(jid, successCb, errorCb);
};

function handleCreateRoomFromLeftSidePanel(data) {
    console.log("handleCreateRoomFromLeftSidePanel");
    JappixMini.createGroupchatPrompt();
}

function handleInviteToGroupchatFromLeftSidePanel() {
    console.log("handleInviteToGroupchatFromLeftSidePanel");
    //JappixMini.inviteToGroupchat();
    JappixMini.groupchatPrompt()
}

function handleStartVideoconferenceFromLeftSidePanel() {
    console.log("handleStartVideoconferenceFromLeftSidePanel");
    JappixMini.startVideoConference();
}

function handleInviteToVideoconferenceFromLeftSidePanel(data) {
    console.log("handleInviteToVideoconferenceFromLeftSidePanel", data);
    var conference = data;
    JappixMini.inviteToVideoConference(conference);
}

function handleJoinVideoconferenceFromLeftSidePanel() {
    console.log("handleJoinVideoconferenceFromLeftSidePanel");
    JappixMini.startVideoConference();
}

function handleAddContactToFavoriteFromLeftSidePanel(data) {
    console.log("handleAddContactToFavoriteFromLeftSidePanel", data);
}

function favoriteContactFromLeftSidePanelSelected(item) {
	var displayName = item._text;
	var jid = item._extraInfo;
	//!var jid = JappixMini.getJIDFromDisplayName(displayName);
    console.log("favoriteContactFromLeftSidePanelSelected", jid);
    JappixMini.startTextChat(jid);
}

function groupChatFromLeftSidePanelSelected(item) {
	var displayName = item._text;
	var roomJID = item._extraInfo;
    console.log("groupChatFromLeftSidePanelSelected", roomJID);
    JappixMini.startGroupTextChatFromJID(roomJID);
}

/*DwtList*/

var biz_vnc_contact_AddressbookList = function(params) {
	ZmListView.call(this,params);
};

biz_vnc_contact_AddressbookList.prototype = new ZmListView;

biz_vnc_contact_AddressbookList.prototype.constructor = biz_vnc_contact_AddressbookList ;

biz_vnc_contact_AddressbookList.prototype.toString = function(){
	return "biz_vnc_contact_AddressbookList";
};

biz_vnc_contact_AddressbookList.prototype._getCellContents = function(htmlArr, idx, item, field, colIdx, params) {
	htmlArr[idx++] = item[field];
	return idx;
};

biz_vnc_contact_AddressbookList.prototype._columnClicked = function(clickedCol, ev) {
	DwtListView.prototype._columnClicked.call(this, clickedCol, ev);
	if(ev.dwtObj._className=="vnc_talk_list_selection_tab"){
		var column_name = ev.dwtObj._currentColId;
		if(column_name != null){
			column_name = column_name.substr(column_name.lastIndexOf("__")+2,column_name.length);
			this._controller._container.listview.set(this._getVectorList(column_name,ev.dwtObj._bSortAsc,this._controller._container.listview._list));
		}
	}
};

biz_vnc_contact_AddressbookList.prototype._getVectorList = function(column_name, sort_type_asc, ary) {
	this.ary = new AjxVector();
	this.ary = ary.clone();
	if(column_name=="Type"){
		if(sort_type_asc==true){
			this.ary._array.sort(function(a,b) { return a.Type > b.Type ? 1 : -1});
		}else{
			this.ary._array.sort(function(a,b) { return a.Type < b.Type ? 1 : -1});
		}
	}
	if(column_name=="EmailAddress"){
		if(sort_type_asc==true){
			this.ary._array.sort(function(a,b) { return a.EmailAddress > b.EmailAddress ? 1 : -1});
		}else{
			this.ary._array.sort(function(a,b) { return a.EmailAddress < b.EmailAddress ? 1 : -1});
		}
	}
	if(column_name=="DisplayName"){
		if(sort_type_asc==true){
			this.ary._array.sort(function(a,b) { return a.DisplayName > b.DisplayName ? 1 : -1});
		}else{
			this.ary._array.sort(function(a,b) { return a.DisplayName < b.DisplayName ? 1 : -1});
		}
	}
	return this.ary;
};
