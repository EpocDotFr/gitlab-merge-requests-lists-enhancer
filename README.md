# GitLab Merge Requests lists enhancer

A browser extension that enhance all Merge Requests lists on any instance of Gitlab and GitLab.com.

<p align="center">
  <img src="screenshot.png">
</p>

## Features

  - No configuration needed: install and it just works
  - Display source and target branches
    - Buttons allowing to easily copy these branches name (can be disabled in the extension preferences)
  - Button allowing to copy Merge Request information (useful when sharing the Merge Request on e.g instant messaging softwares)
    - Can be disabled in the extension preferences
    - Text format is customizable (with support of placeholders)
  - Direct Jira ticket link
    - Can be enabled/disabled in the extension preferences
    - Ticket ID is automatically detected in source branch name or Merge Request title
    - Base Jira URL is configured in extension preferences
    - The ticket ID or an icon can be displayed as the link label (configured in extension preferences)
  - WIP / unWIP toggle button (can be disabled in the extension preferences)
  - Compatible with all GitLab editions (GitLab CE, GitLab EE, GitLab.com) (look at the prerequisites, though)

## Prerequisites

  - **GitLab**: 9.0 or above or GitLab.com (this addon requires GitLab API v4)
  - **Firefox**: >= 63 (because this extension uses the `clipboard.writeText` API)
  - **Chrome**: >= 66 (because this extension uses the `clipboard.writeText` API)

## Installation

  - **Firefox**: from the [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/gitlab-mrs-lists-enhancer/) website
  - **Chrome**: from the [Chrome Web Store](https://chrome.google.com/webstore/detail/gitlab-merge-requests-lis/emiefdjcbfjkaofipmdcflcddcchmdkf) website

You can also install this add-on manually by using one of the ZIP files on the [Releases](https://github.com/EpocDotFr/gitlab-merge-requests-lists-enhancer/releases) page.

## Credits

  - Logo: [GitLab](https://about.gitlab.com/press/press-kit/#logos) and [Octicons](https://primer.style/octicons/git-pull-request) (MIT License)

## Roadmap

👉 = current version

  - **1.0** - Initial release (display Merge Request source and target branches name)
  - **1.1** - Copy source and target branches name
  - **1.2** - Copy Merge Request information (intended for sharing on e.g instant messaging softwares)
  - **1.3** - Direct Jira ticket link (automatic detection of ticket ID in source branch name or Merge Request title)
  - 👉 **1.4** - WIP / unWIP toggle button
  - **1.5**
    - New option: enable display Merge Request source and target branches
    - New options: enable copy source and target branches name button (one option for each branches)

## License

[DBAD 1.1](LICENSE.md)

## End words

If you have questions or problems, you can [submit an issue](https://github.com/EpocDotFr/gitlab-merge-requests-lists-enhancer/issues).

You can also submit pull requests. It's open-source dude!
