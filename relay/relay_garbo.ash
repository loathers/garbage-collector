record setting {
	string name;
	string type;
	string description;
};

setting[string][int] s;
string[string] fields;
boolean success;

void write_styles()
{
	# This function provided by Zen00.
	writeln("<style type='text/css'>"+
	"body {"+
	"width: 95%;"+
	"margin: auto;"+
	"background: #EAEAEA;"+
	"text-align:center;" +
	"padding:0;"+
	"cursor:default;"+
	"user-select: none;"+
	"-webkit-user- select: none;"+
	"-moz-user-select: text;}"+

	"h1 {"+
	"font-family:times;" +
	"font-size:125%;"+
	"color:#000;}"+

	"table, th, td {"+
	"border: 1px solid black;}"+
	"</style>");
}

void handleSetting(string type, int x)
{
	string color = "white";
	switch(type)
	{
		case "setting":		color = "#00ffff";		break;
		default:		color = "#ffffff";		break;
	}

	setting set = s[type][x];
	switch(set.type)
	{
	case "boolean":
		string checked = "";
		if(get_property(set.name) == "true")
		{
			checked = " checked";
		}
		write("<tr bgcolor="+color+"><td align=center>"+set.name+"</td><td align=center>"
				+ "<input type='checkbox' name='"+set.name+"' value='true'"+checked+">");
		writeln("</td><td>"+set.description+"</td></tr>");
		break;
	default:
		writeln("<tr bgcolor="+color+"><td align=center>"+set.name+"</td><td><input type='text' name='"+set.name+"' value='"+get_property(set.name)+"' /></td><td>"+set.description+"</td></tr>");
		break;
	}
	writeln("<input type='hidden' name='"+set.name+"_oldvalue' value='"+get_property(set.name)+"' />");
}

void main()
{

	write_styles();
	writeln("<html><head><title>Garbo Configuration UI</title>");
	writeln("</head><body><h1>Garbo Configuration UI</h1>");


	//generate settings table
	file_to_map("garbo_settings.txt", s);
	fields = form_fields();
	if(count(fields) > 0)
	{
		foreach x in fields
		{
			if(contains_text(x, "_didchange"))
			{
				continue;
			}

			string oldSetting = form_field(x + "_didchange");
			if(oldSetting == fields[x])
			{
				if(get_property(x) != fields[x])
				{
					writeln("You did not change setting " + x + ". It changed since you last loaded the page, ignoring.<br>");
				}
				continue;
			}
			if(get_property(x) != fields[x])
			{
				writeln("Changing setting " + x + " to " + fields[x] + "<br>");
				set_property(x, fields[x]);
			}
		}
	}

	writeln("<form action='' method='post'>");
	writeln("<table align=center><tr><th width=20%>Setting</th><th width=20%>Value</th><th width=60%>Description</th></tr>");
	foreach x in s["setting"]
	{
		handleSetting("setting", x);
	}

	writeln("<tr><td align=center colspan='3'><input type='submit' name='' value='Save Changes'/></td></tr></table></form>");

	writeln("<h2>Info</h2>");
	writeln("garbo version: " +svn_info("garbage-collector").last_changed_rev+ "<br>");

	writeln("<br>");
	writeln("</body></html>");
} 