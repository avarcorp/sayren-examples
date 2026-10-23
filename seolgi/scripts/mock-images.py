"""mock 모드 상품·리뷰 그림(SVG)을 public/mock/에 만든다. 실제 사진이 아니라 형태만 그린 일러스트다.
다시 만들려면: python3 scripts/mock-images.py"""
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "mock")
W, H = 400, 500


def svg(bg, body):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W*2}" height="{H*2}">'
        f'<rect width="{W}" height="{H}" fill="{bg}"/>'
        f'<ellipse cx="200" cy="430" rx="130" ry="14" fill="#000" opacity="0.06"/>{body}</svg>'
    )


def harness(c, dark):
    return (
        f'<path d="M110 150 C150 120 250 120 290 150 L300 330 C250 360 150 360 100 330 Z" fill="{c}" stroke="{dark}" stroke-width="4"/>'
        f'<path d="M110 150 C150 120 250 120 290 150" fill="none" stroke="{dark}" stroke-width="14" stroke-linecap="round"/>'
        f'<path d="M100 330 C150 360 250 360 300 330" fill="none" stroke="{dark}" stroke-width="14" stroke-linecap="round"/>'
        + "".join(f'<circle cx="{x}" cy="{y}" r="5" fill="{dark}" opacity="0.25"/>' for x in range(130, 290, 22) for y in range(175, 320, 22))
        + f'<rect x="185" y="90" width="30" height="60" rx="6" fill="{dark}"/>'
        f'<circle cx="200" cy="80" r="16" fill="none" stroke="#9a9a9a" stroke-width="7"/>'
        f'<rect x="170" y="318" width="60" height="30" rx="6" fill="#222" opacity="0.85"/>'
        f'<path d="M120 245 L280 245" stroke="#fff" stroke-width="6" opacity="0.7" stroke-dasharray="2 10" stroke-linecap="round"/>'
    )


def tag(shape, face, edge, name="설기"):
    ring = f'<circle cx="200" cy="105" r="22" fill="none" stroke="{edge}" stroke-width="7"/>'
    if shape == "round":
        body = f'<circle cx="200" cy="250" r="115" fill="{face}" stroke="{edge}" stroke-width="5"/>'
    elif shape == "bone":
        body = (
            f'<path d="M140 200 L260 200 A40 40 0 1 1 300 250 A40 40 0 1 1 260 300 L140 300 A40 40 0 1 1 100 250 A40 40 0 1 1 140 200 Z" '
            f'fill="{face}" stroke="{edge}" stroke-width="5"/>'
        )
    else:
        body = (
            f'<path d="M200 370 C110 300 80 250 80 205 C80 160 115 135 150 135 C175 135 192 150 200 165 '
            f'C208 150 225 135 250 135 C285 135 320 160 320 205 C320 250 290 300 200 370 Z" fill="{face}" stroke="{edge}" stroke-width="5"/>'
        )
    hole = f'<circle cx="200" cy="{150 if shape != "bone" else 215}" r="9" fill="#fff" opacity="0.8"/>'
    text = f'<text x="200" y="{268 if shape != "heart" else 255}" text-anchor="middle" font-family="Jua, sans-serif" font-size="56" fill="#5a4426" opacity="0.85">{name}</text>'
    return ring + body + hole + text


def tug(a, b):
    knots = "".join(
        f'<ellipse cx="{x}" cy="{y}" rx="34" ry="30" fill="{a}" stroke="{b}" stroke-width="4"/>'
        f'<path d="M{x-24} {y-14} Q{x} {y+10} {x+24} {y-14} M{x-24} {y+4} Q{x} {y+26} {x+24} {y+4}" stroke="{b}" stroke-width="3" fill="none"/>'
        for x, y in [(110, 170), (290, 330)]
    )
    rope = f'<path d="M130 190 C180 260 220 240 270 310" stroke="{b}" stroke-width="30" fill="none" stroke-linecap="round"/>'
    rope2 = f'<path d="M130 190 C180 260 220 240 270 310" stroke="{a}" stroke-width="18" fill="none" stroke-dasharray="14 10" stroke-linecap="round"/>'
    fleece = f'<circle cx="200" cy="250" r="44" fill="#f4efe6" stroke="{b}" stroke-width="4"/>'
    return rope + rope2 + knots + fleece


def leash(c):
    coil = "".join(
        f'<ellipse cx="200" cy="{240+i*14}" rx="{120-i*6}" ry="{70-i*3}" fill="none" stroke="{c}" stroke-width="12"/>'
        for i in range(5)
    )
    refl = "".join(
        f'<ellipse cx="200" cy="{240+i*14}" rx="{120-i*6}" ry="{70-i*3}" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="4 12" opacity="0.8"/>'
        for i in range(5)
    )
    handle = f'<path d="M200 170 C150 90 250 90 200 170" stroke="{c}" stroke-width="14" fill="none"/>'
    clip = f'<rect x="300" y="300" width="22" height="50" rx="8" fill="#9a9a9a"/><circle cx="311" cy="292" r="12" fill="none" stroke="#9a9a9a" stroke-width="6"/>'
    return handle + coil + refl + clip


def collar(c, dark):
    return (
        f'<ellipse cx="200" cy="250" rx="140" ry="110" fill="none" stroke="{c}" stroke-width="40"/>'
        f'<ellipse cx="200" cy="250" rx="140" ry="110" fill="none" stroke="{dark}" stroke-width="2" stroke-dasharray="6 8" opacity="0.6"/>'
        f'<rect x="300" y="215" width="46" height="70" rx="6" fill="none" stroke="#b9a27a" stroke-width="8"/>'
        f'<circle cx="200" cy="378" r="16" fill="none" stroke="#b9a27a" stroke-width="6"/>'
        f'<circle cx="200" cy="410" r="20" fill="#e6cf9f" stroke="#cdb07a" stroke-width="3"/>'
    )


def donut(c, inner):
    return (
        f'<ellipse cx="200" cy="270" rx="160" ry="120" fill="{c}"/>'
        f'<ellipse cx="200" cy="255" rx="150" ry="108" fill="{c}" stroke="#000" stroke-opacity="0.06" stroke-width="6"/>'
        f'<ellipse cx="200" cy="262" rx="78" ry="52" fill="{inner}"/>'
        + "".join(f'<path d="M{x} {y} q6 -8 12 0" stroke="#000" stroke-opacity="0.08" stroke-width="3" fill="none"/>' for x, y in [(90, 220), (300, 230), (120, 320), (270, 330), (200, 180)])
    )


def pouch(c, dark):
    return (
        f'<rect x="120" y="160" width="160" height="210" rx="40" fill="{c}" stroke="{dark}" stroke-width="5"/>'
        f'<rect x="150" y="190" width="100" height="40" rx="10" fill="{dark}" opacity="0.2"/>'
        f'<path d="M140 160 C140 110 260 110 260 160" stroke="{dark}" stroke-width="10" fill="none"/>'
        f'<path d="M160 300 L240 300 A14 14 0 1 1 244 312 A14 14 0 1 1 240 324 L160 324 A14 14 0 1 1 156 312 A14 14 0 1 1 160 300 Z" fill="#fff" opacity="0.85"/>'
    )


def autoleash(c):
    return (
        f'<path d="M110 260 C110 180 170 150 230 150 C300 150 320 210 320 260 C320 330 280 360 220 360 C160 360 110 330 110 260 Z" fill="{c}"/>'
        f'<circle cx="215" cy="255" r="58" fill="#fff" opacity="0.25"/>'
        f'<rect x="130" y="330" width="60" height="90" rx="22" fill="{c}"/>'
        f'<rect x="240" y="170" width="40" height="20" rx="8" fill="#222"/>'
        f'<path d="M320 260 L380 230" stroke="#555" stroke-width="5"/>'
    )


def mat(c, patches):
    out = f'<rect x="70" y="140" width="260" height="240" rx="18" fill="{c}"/>'
    i = 0
    for y in range(160, 360, 40):
        for x in range(90, 310, 40):
            col = patches[i % len(patches)]
            out += f'<path d="M{x} {y+30} q16 -36 32 0 z" fill="{col}"/>'
            i += 1
    return out


def bowl(wood, bowlc):
    return (
        f'<rect x="80" y="230" width="240" height="40" rx="10" fill="{wood}"/>'
        f'<rect x="100" y="270" width="18" height="110" fill="{wood}"/><rect x="282" y="270" width="18" height="110" fill="{wood}"/>'
        f'<ellipse cx="150" cy="230" rx="50" ry="16" fill="{bowlc}"/><ellipse cx="250" cy="230" rx="50" ry="16" fill="{bowlc}"/>'
        f'<path d="M100 230 Q150 280 200 230 M200 230 Q250 280 300 230" fill="{bowlc}"/>'
    )


def blanket(a, b):
    out = f'<path d="M80 170 L320 150 L330 360 L90 380 Z" fill="{a}"/>'
    for i in range(6):
        out += f'<path d="M{90+i*40} {168-i*3} L{100+i*40} {378-i*3}" stroke="{b}" stroke-width="10" opacity="0.6"/>'
    out += f'<path d="M90 380 Q200 420 330 360 L330 380 Q200 440 90 400 Z" fill="{b}" opacity="0.5"/>'
    return out


def potato():
    return (
        '<path d="M110 290 C90 210 160 150 230 160 C310 170 330 250 300 310 C270 370 140 380 110 290 Z" fill="#b45e86"/>'
        '<path d="M110 290 C90 210 160 150 230 160 C310 170 330 250 300 310" fill="none" stroke="#8c3f63" stroke-width="5"/>'
        '<path d="M230 160 C240 120 270 110 290 120" stroke="#5c8a4a" stroke-width="10" fill="none" stroke-linecap="round"/>'
        '<circle cx="180" cy="250" r="8" fill="#3b2230"/><circle cx="240" cy="250" r="8" fill="#3b2230"/>'
        '<path d="M195 280 q15 14 30 0" stroke="#3b2230" stroke-width="5" fill="none" stroke-linecap="round"/>'
    )


def dog(fur, ear, bg_obj=""):
    return (
        bg_obj
        + f'<ellipse cx="120" cy="190" rx="44" ry="80" fill="{ear}" transform="rotate(20 120 190)"/>'
        f'<ellipse cx="280" cy="190" rx="44" ry="80" fill="{ear}" transform="rotate(-20 280 190)"/>'
        f'<ellipse cx="200" cy="250" rx="120" ry="115" fill="{fur}"/>'
        f'<ellipse cx="200" cy="300" rx="62" ry="46" fill="#fff" opacity="0.85"/>'
        '<circle cx="155" cy="235" r="11" fill="#2a2018"/><circle cx="245" cy="235" r="11" fill="#2a2018"/>'
        '<ellipse cx="200" cy="282" rx="18" ry="13" fill="#2a2018"/>'
        '<path d="M200 295 q-14 22 -30 8 M200 295 q14 22 30 8" stroke="#2a2018" stroke-width="4" fill="none" stroke-linecap="round"/>'
        '<ellipse cx="200" cy="335" rx="13" ry="16" fill="#e98c8c"/>'
    )


IMAGES = {
    "harness-cream": svg("#f3ede3", harness("#f4ead8", "#c9b38c")),
    "harness-peach": svg("#f7e6dc", harness("#f3b9a0", "#c9836a")),
    "harness-mint": svg("#e6eee6", harness("#b9dcc8", "#7aa58c")),
    "harness-charcoal": svg("#ecebea", harness("#555a5f", "#2c3034")),
    "tag-round": svg("#f6e6d3", tag("round", "#e6cf9f", "#cdb07a")),
    "tag-bone": svg("#f6e6d3", tag("bone", "#d9dcdf", "#a9aeb3")),
    "tag-heart": svg("#f6e6d3", tag("heart", "#f0c7b8", "#cf9c88")),
    "tug-1": svg("#e6eee6", tug("#e8c58f", "#a7814a")),
    "tug-2": svg("#f3ede3", tug("#9cc3d6", "#5d8aa0")),
    "leash-1": svg("#f3ede3", leash("#ad5e1c")),
    "leash-2": svg("#e9ecef", leash("#3f6b8f")),
    "collar-1": svg("#f3ede3", collar("#8a5a35", "#5d3a20")),
    "collar-2": svg("#f7f4ef", collar("#2f2f2f", "#111")),
    "donut-1": svg("#ece8f1", donut("#d8d0c4", "#c9bfb1")),
    "donut-2": svg("#f3ede3", donut("#c7b8a3", "#b5a58f")),
    "pouch-1": svg("#f3ede3", pouch("#7aa58c", "#4f7a62")),
    "cooling-1": svg("#e6eef3", harness("#a9d1e8", "#5e98b8")),
    "cooling-2": svg("#eef3f6", harness("#e8f1f6", "#9fbccb")),
    "autoleash-1": svg("#f3ede3", autoleash("#ad5e1c")),
    "namecollar-1": svg("#f7f4ef", collar("#b45f3c", "#7c3a20")),
    "treatpouch-1": svg("#f3ede3", pouch("#c8742c", "#8a4c18")),
    "hearttag-1": svg("#f6e6d3", tag("heart", "#e6cf9f", "#cdb07a", "보리")),
    "potato-1": svg("#e6eee6", potato()),
    "nosework-1": svg("#e6eee6", mat("#c9b38c", ["#7aa58c", "#ad5e1c", "#e6cf9f"])),
    "bowl-1": svg("#ece8f1", bowl("#c79a6b", "#f4f1ea")),
    "blanket-1": svg("#ece8f1", blanket("#e8d9c4", "#c8742c")),
    "review-dog-1": svg("#f7f4ef", dog("#f2e3c9", "#d9b98a")),
    "review-dog-2": svg("#eef1f4", dog("#ffffff", "#e8dccb")),
    "review-dog-3": svg("#f3ede3", dog("#c08a57", "#8a5a35")),
    "review-dog-4": svg("#e6eee6", dog("#3b3330", "#221c1a")),
}

os.makedirs(OUT, exist_ok=True)
for name, body in IMAGES.items():
    with open(os.path.join(OUT, f"{name}.svg"), "w") as f:
        f.write(body)
print(len(IMAGES), "files")
