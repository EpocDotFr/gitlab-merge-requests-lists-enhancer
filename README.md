# GitLab Merge Requests lists enhancer

A browser extension that enhance all Merge Requests lists on any instance of Gitlab and GitLab.com.

<p align="center">
  <img src="screenshot.png">
</p>

## Features

  - No configuration needed: install and it just works
  - Display source and target branches
    - Can be enabled/disabled in the extension preferences
    - Buttons allowing to easily copy these branches name (can be enabled/disabled in the extension preferences)
  - Button allowing to copy Merge Request information (useful when sharing the Merge Request on e.g instant messaging softwares)
    - Can be enabled/disabled in the extension preferences
    - Text format is customizable (with support of placeholders)
  - Direct Jira ticket link
    - Can be enabled/disabled in the extension preferences
    - Ticket ID is automatically detected in source branch name or Merge Request title
    - Base Jira URL is configured in extension preferences
    - The ticket ID or an icon can be displayed as the link label (configured in extension preferences)
  - WIP toggle button (can be enabled/disabled in the extension preferences)
  - Automatic update of Merge Requests' pipeline status icon every 10 seconds (can be enabled/disabled in the extension preferences)
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

## FAQ

  - Why is there still clickable links on deleted source/target branches name?

Due to a technical GitLab limitation, the extension has no reliable way to determine if a branch has been deleted. Therefore, branches name are always links and are always clickable even though it's leading to a 404 page.

  - Can you display a link to the Merge Request linked to the target branch, if any?

It would be great, however the extension has no reliable way to do that due to a technical GitLab limitation.

## Changelog

See [here](https://github.com/EpocDotFr/gitlab-merge-requests-lists-enhancer/releases).

## License

[DBAD 1.1](LICENSE.md)

## End words

If you have questions or problems, you can [submit an issue](https://github.com/EpocDotFr/gitlab-merge-requests-lists-enhancer/issues).

You can also submit pull requests. It's open-source dude!
