# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2025-10-09

### Changed

- The center frequencies are now initialized with the actual default FATs
  for the various manufacturers that I found in the literature,
  instead of using a default log space distribution from 200..7500 Hz.

## [1.0.0] - 2025-10-01

### Added

- Initial public release of bicial (Binaural CI Alignment)
- Binaural CI alignment functionality for cochlear implant users
- Support for 12, 16, and 22 electrode configurations
- Individual frequency adjustment controls with nudge buttons (±1 Hz, ±10 Hz)
- Per-row and global volume controls
- Multiple playback modes:
  - Single ear beeps (L/R)
  - Alternating left-right playback
  - Simultaneous bilateral playback
  - Batch playback for selected rows
- Visual cochlea representation for electrode orientation
- Comprehensive keyboard shortcuts:
  - A/S/D/F for frequency nudging (-10/-1/+1/+10 Hz)
  - J/K/L/; for playback controls (Left/Right/Alternate/Simultaneous)
- Settings persistence using localStorage
- Import/export functionality for settings backup and sharing
- FAT (Frequency Allocation Table) copy/paste support
- Comprehensive help documentation with medical disclaimers
- Responsive design with modern CSS
- Accessibility features including ARIA labels and keyboard navigation
- Error handling and graceful fallbacks
- MIT license for open source distribution

### Technical Features

- Pure HTML/CSS/JavaScript implementation (no frameworks or build process)
- Web Audio API integration with sine wave generation
- Stereo panning and channel routing
- Real-time audio parameter adjustment
- Clean, maintainable codebase with comprehensive comments

## [Unreleased]

### Planned

- User interface improvements based on feedback
