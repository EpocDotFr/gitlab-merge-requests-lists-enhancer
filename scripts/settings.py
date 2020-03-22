MANIFEST_FILE = {
    'manifest_version': 2,
    'name': 'GitLab Merge Requests lists enhancer',
    'version': '1.0.0',
    'description': 'An extension that enhance all Merge Requests lists on any instance of Gitlab and GitLab.com.',
    'homepage_url': 'https://github.com/EpocDotFr/gitlab-merge-requests-lists-enhancer',
    'author': 'Maxime \'Epoc\' G.',
    'icons': {
        '16': 'images/logo_16.png',
        '48': 'images/logo_48.png',
        '96': 'images/logo_96.png',
        '128': 'images/logo_128.png'
    },
    'content_scripts': [
        {
            'matches': ['*://*/*/*/-/merge_requests', '*://*/*/*/-/merge_requests?*'],
            'js': ['js/content.js']
        }
    ],
    'permissions': [
        '*://*/*/*/-/merge_requests', '*://*/*/*/-/merge_requests?*'
    ]
}

FILES_AND_DIRECTORIES_TO_IGNORE_WHEN_BUILDING = [
    'scripts',
    'web-ext-artifacts',
    'LICENSE.md',
    'README.md',
    'screenshot.png',
]