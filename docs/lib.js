var byId       = id          => document.getElementById(id)
var formatWad  = wad         => String(wad).replace(/\..*/, "")
var formatEOS  = wad         => wad.toFormat(4)
var formatETH  = wad         => wad.toFormat(2)
var getValue   = id          => byId(id).value
var show       = id          => byId(id).classList.remove("hidden")
var hide       = id          => byId(id).classList.add("hidden")
var iota       = n           => repeat("x", n).split("").map((_, i) => i)
var repeat     = (x, n)      => new Array(n + 1).join("x")
var adjust     = (x, f)      => { x.innerHTML = f(x.innerHTML) }
var append     = (id, html)  => { adjust(byId(id), x => x + html) }
var render     = (id, html)  => { adjust(byId(id), () => html) }
var react      = (id, jsx)   => ReactDOM.render(jsx, byId(id))
