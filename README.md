<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Lintree</title>

<style>
*{
    margin:0;
    padding:0;
    box-sizing:border-box;
}

body{
    font-family: Inter, sans-serif;
    background:#fff;
    color:#000;
    min-height:100vh;
}

.container{
    max-width:1100px;
    margin:auto;
    padding:120px 32px;
}

.hero{
    display:flex;
    flex-direction:column;
    gap:24px;
}

.badge{
    width:fit-content;
    padding:8px 14px;
    border:1px solid #e5e5e5;
    border-radius:999px;
    font-size:.9rem;
}

h1{
    font-size:clamp(3rem,8vw,7rem);
    font-weight:700;
    line-height:.95;
    letter-spacing:-4px;
}

.subtitle{
    max-width:700px;
    font-size:1.2rem;
    line-height:1.8;
    color:#666;
}

.grid{
    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(250px,1fr));
    gap:24px;
    margin-top:120px;
}

.card{
    padding:32px;
    border:1px solid #eee;
    border-radius:24px;
    transition:.3s;
}

.card:hover{
    transform:translateY(-5px);
}

.card h3{
    margin-bottom:12px;
    font-size:1.2rem;
}

.card p{
    color:#666;
    line-height:1.7;
}

.footer{
    margin-top:120px;
    padding-top:40px;
    border-top:1px solid #eee;
    color:#888;
}
</style>
</head>
<body>

<div class="container">

    <div class="hero">
        <div class="badge">
            ✦ Open Source
        </div>

        <h1>
            Lintree
        </h1>

        <p class="subtitle">
            A modern and lightweight link-in-bio platform built for creators,
            developers, and brands who want a clean digital presence.
        </p>
    </div>

    <div class="grid">

        <div class="card">
            <h3>Fast</h3>
            <p>
                Optimized for performance and instant loading.
            </p>
        </div>

        <div class="card">
            <h3>Responsive</h3>
            <p>
                Looks great on desktop, tablet, and mobile devices.
            </p>
        </div>

        <div class="card">
            <h3>Customizable</h3>
            <p>
                Personalize your profile and links to match your identity.
            </p>
        </div>

    </div>

    <div class="footer">
        © 2026 Lintree. Built with simplicity.
    </div>

</div>

</body>
</html>
