"""Generates the section artwork. Each `scene_<name>.py` next to this file draws one scene with
the shared kit in `kit.py` and is written to `<name>-scene.svg`, which the site uses (see
src/components/sectionArt.tsx).

    python3 src/images/section-art/generate.py            # all scenes
    python3 src/images/section-art/generate.py intro      # one scene
"""
import importlib, pathlib, sys

HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE))

if __name__ == '__main__':
    names = sys.argv[1:] or sorted(p.stem[len('scene_'):] for p in HERE.glob('scene_*.py'))
    for name in names:
        module = importlib.import_module(f'scene_{name}')
        (HERE / f'{module.NAME}-scene.svg').write_text(module.build())
        print(f'wrote {module.NAME}-scene.svg')
