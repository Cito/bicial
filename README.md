# bicial - Binaural CI Alignment

This is a small, single‑page tool for people with single‑sided deafness (SSD) who use a cochlear implant (CI) in one ear to compare the implant’s configured center frequencies with tones played to the acoustic (non‑CI) ear. This pitch‑based fitting can be considered an alternative to anatomy‑based fitting.

To run the application, just open its [GitHub page](https://cito.github.io/bicial/) or [download](https://github.com/Cito/bicial/releases) the latest release and open the `index.html` file locally in your browser.

## Usage

First, specify which side is the CI side, and how many electrodes the CI has (usually 12 for MED-EL, 16 for Advanced Bionics and 22 for Cochlear implants). Then enter the center frequencies for all electrodes in the column for the CI side. You can get the frequencies from your audiologists, they are stored in the FAT (frequency allocation table).

Listen to the output of the tool using good over‑ear headphones that cover your acoustic ear and your CI. The "L" buttons play a short sound with the respective frequency on your left ear; the "R" buttons on your right ear. The L/R button plays these alternating, and the L+R button plays both simultaneously.

As a first step, adjust the volume of the output on your computer. Usually, you can also shift the stereo balance if the CI side is not loud enough. Set volumes that are comfortable to hear but avoid setting them too loud, as this could damage your hearing. You can also adjust these volumes globally using the sliders at the bottom of the page, individually for the left and right side.

Next, make sure that the CI‑side frequencies all appear equally loud. Normally you should not need to change much here, since the levels should already have been set like that by your audiologist. If needed, you can still adjust the volumes individually with the sliders on the right side. Then adjust the volume of the frequencies on the non‑CI side so that they all appear equally loud. This may be needed, for instance, to compensate high‑frequency hearing loss that is commonly caused by the natural aging process.

When the volume levels are well adjusted, compare the frequencies you hear in both ears. You can adjust the frequencies you hear on your acoustic ear using the up and down buttons. The center frequencies on the CI side should not be modified.

You can use the L and R buttons to hear a short beep on the respective ear, or use the L/R button to hear several alternating beeps. You can change the length of the beeps and number of repetitions at the bottom of the page. You can also use the L+R button to play both frequencies to the respective ears simultaneously, as an alternative way of frequency comparison. In addition to comparing single frequencies, you can compare the intervals between frequencies by selecting some electrodes using the checkboxes and then using the buttons in the bottom row to play them sequentially. The intervals on the left and right side should sound equal.

Tip: After the first interaction with a row, you can control alignment via keyboard shortcuts (shown in the tooltips). `A`/`S`/`D`/`F` nudge the non‑CI ear frequency (−10/−1/+1/+10), and `J`/`K`/`L`/`;` play Left/Right/Alternate/Simultaneous.
Tip: You can use the Copy/Paste buttons at the bottom to copy the frequencies from the old FAT and paste the frequencies of the new FAT, so you don't need to retype everything.

You can also show a visual representation of the frequencies to quickly assess how well they align and to detect possible input errors and misalignments.

## What is happening in the brain

The brain compares sounds from both ears by sending each ear’s signals to both hemispheres, where specialized regions analyze frequency, loudness, and timing. The left and right auditory cortices exchange information, allowing subtle differences—such as fine variations in frequency or timing—to be detected and compared.

This comparison is not perfectly symmetrical: the left hemisphere is generally more sensitive to rapid, detailed changes, while the right is better at processing slower, more melodic patterns. Factors like natural neural delays, the “right-ear advantage,” and individual hearing differences can make fine frequency judgments between ears more difficult.

A striking example of binaural integration occurs with binaural beats: when two slightly different tones are played separately to each ear, the brain can generate the perception of a third, rhythmic beat corresponding to the frequency difference—even though this beat is absent in the actual sound waves. This effect arises in the brainstem, particularly in the superior olivary complex, where inputs from both ears converge. Binaural beats are most noticeable with tones below about 1000 Hz and frequency differences under ~35 Hz; larger differences are heard as two distinct tones rather than a fused beat. Occasionally, instead of a beat, listeners may perceive an illusory tone close to the average of the two frequencies.

Binaural alignment is more demanding than monaural alignment because it requires coordinating signals that are first processed largely in parallel pathways on opposite sides of the brain. Communication between hemispheres occurs through the corpus callosum, which introduces limits and delays. In contrast, monaural comparisons occur within a single auditory pathway, enabling more direct and precise frequency analysis. This inter-hemispheric bottleneck makes binaural processing inherently more complex and prone to small errors. On top of that, auditory fatigue and habituation can reduce sensitivity over time, while the brain’s own “auto-correction” mechanisms may smooth over small discrepancies—sometimes improving coherence, but also occasionally masking fine differences that are actually present.

## Terms and Disclaimer

I am not a medical professional, and this tool must not be considered a substitute for professional medical advice, diagnosis, or treatment. The information and outputs provided are for personal and experimental use only.

Due to the inherent limitations of binaural processing—including inter-hemispheric delays, habituation, fatigue effects, and the brain’s own corrective mechanisms—the alignment results produced by this tool may be inaccurate. As a consequence, adjustments to the frequency allocation table based on these results could potentially make hearing outcomes worse rather than better. For this reason, any use of the tool to modify configured frequencies should only be considered if the alignment results prove to be stable, reproducible, and reliable.

Even in that case I cannot guarantee that the outputs will improve hearing outcomes, and I accept no responsibility or liability for any issues that may arise from using this tool. Users with cochlear implants should always consult qualified specialists—such as ENT physicians, audiologists, or clinicians at a cochlear implant center—for guidance regarding their individual situation. By using this tool, you acknowledge that you do so at your own risk and responsibility.

## Open Source and Feedback

This tool is provided as open-source software under the MIT license. I warmly welcome any kind of feedback—whether from cochlear implant users or healthcare professionals—to help improve its usefulness and reliability.

This project includes code generated with AI tools, I have included instructions to recreate it in the project.

## Credits

I would like to express my gratitude to the staff at ENT clinics, CI rehabilitation centers, cochlear implant manufacturers, and the medical research community for their excellent and invaluable work, which is so essential for patients with hearing loss and has inspired me to develop this project.
