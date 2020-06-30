import subprocess
import argparse
import settings
import json
import os


def create_manifest_file(target):
    data = settings.MANIFEST_FILE

    if target == 'firefox':
        data['options_ui']['browser_style'] = True
        data['browser_specific_settings'] = {
            'gecko': {
                'id': 'gmrle@epoc.fr',
                'strict_min_version': '63.0'
            }
        }
    elif target == 'chrome':
        data['options_ui']['chrome_style'] = True
        data['minimum_chrome_version'] = '66'

    with open('manifest.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)


def switch(target):
    print('Switching to ' + target)

    create_manifest_file(target)

    print('  Done')


def build(target):
    print('Building for ' + target)

    switch(target)

    arguments = [
        'web-ext',
        'build',
        '--overwrite-dest',
        '--ignore-files',
    ]

    arguments.extend(settings.FILES_AND_DIRECTORIES_TO_IGNORE_WHEN_BUILDING)

    try:
        subprocess.run(arguments, shell=True, check=True)

        slug = settings.EXTENSION_NAME_SLUG
        version = settings.MANIFEST_FILE['version']

        os.replace(
            'web-ext-artifacts/{slug}-{version}.zip'.format(slug=slug, version=version),
            'web-ext-artifacts/{slug}-{version}_{target}.zip'.format(slug=slug, version=version, target=target)
        )

        print('  Done')
    except subprocess.CalledProcessError as cpe:
        print('Build failed for ' + target + ':')

        raise cpe


def run():
    arg_parser = argparse.ArgumentParser()
    arg_parser.add_argument('action', choices=['build', 'switch'])
    arg_parser.add_argument('target', choices=['firefox', 'chrome', 'opera', 'edge'])

    args = arg_parser.parse_args()

    if args.action == 'build':
        build(args.target)
    elif args.action == 'switch':
        switch(args.target)

if __name__ == '__main__':
    run()
