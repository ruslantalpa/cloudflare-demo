function interpolate (str, params) {
	let names = Object.keys(params);
	let vals = Object.values(params);
	return new Function(...names, `return \`${str}\`;`)(...vals);
}

function render(template, data) {
    let html = '';
    for (let d of data) {
        html += interpolate(template, d);
    }
    return html;
}


document.addEventListener('DOMContentLoaded', async function() {
    document.getElementById("remote_content_1").innerHTML = render(
        '<li>#${id} ${name} - ${tasks_json}</li>', 
        await fetch('/rest/projects?select=id,name:$upper(name),tasks(name)&id=gt.2').then(async function(res){
            let r = await res.json();
            r.forEach(function(d){ d.tasks_json = JSON.stringify(d.tasks); });
            return r;
        })
    );

    document.getElementById("remote_content_2").innerHTML = render(
        '<li>#${total}</li>', 
        await fetch('/rest/get_custom').then(async function(res){
            let r = await res.json();
            return [{total: `Total Projects ${r.projects_total}`}, {total: `Total Tasks ${r.tasks_total}`}];
        })
    );

}, false);