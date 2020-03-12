<style>
  .key p {
    margin: 0;
    font-family: monospace;
    padding: 0.125em;
    line-height: 1;
    text-align: center;
    font-size: 11px;
    font-weight: bold;
  }
  .key {
    border: 1px solid #000;
    width: 3rem;
    cursor: pointer;
    display: block;
  }
  .sharp {
    background-color: #333;
    color: #fff;
  }
</style>

<script>
  import { onMount } from "svelte";
  import midiToNotation from "./midi-to-notation.js";
  import pianoData from "../data/piano.csv";
  import levels from "../data/levels.json";

  let Tone;
  let synth;
  let sampler;

  let selected;
  let melody;

  onMount(async () => {
    const module = await import("tone");
    Tone = module.default;
    synth = new Tone.Synth().toMaster();
    sampler = new Tone.Sampler(
      {
        C2: "C2.mp3",
        "D#2": "Ds2.mp3",
        "F#2": "Fs2.mp3",
        A3: "A3.mp3",
        C3: "C3.mp3",
        "D#3": "Ds3.mp3",
        "F#3": "Fs3.mp3",
        A4: "A4.mp3",
        C4: "C4.mp3",
        "D#4": "Ds4.mp3",
        "F#4": "Fs4.mp3",
        A4: "A4.mp3",
        C5: "C5.mp3",
        "D#5": "Ds5.mp3",
        "F#5": "Fs5.mp3",
        A5: "A5.mp3",
        C5: "C5.mp3"
      },
      {
        release: 1,
        baseUrl: "assets/notes/"
      }
    ).toMaster();
  });

  $: level = levels.find(d => d.title === selected);
  $: if (Tone && level) {
    Tone.Transport.stop();
    if (melody) melody.dispose();
    const values = midiToNotation(level.sequence);
    melody = new Tone.Part((time, value) => {
      sampler.triggerAttackRelease(value.note, value.duration, time);
    }, values).start(0);

    melody.humanize = true;

    //set the transport
    Tone.Transport.bpm.value = level.tempo;
    Tone.Transport.start();
  }

  const lowC = 36;
  const highC = 84;
  let piano = pianoData.filter(d => +d.midi >= lowC && +d.midi <= highC);

  function click(note, octave) {
    // synth.triggerAttackRelease(`${note}${octave}`, "16n");
    sampler.triggerAttackRelease(`${note}${octave}`, "16n");
  }
</script>

<select bind:value="{selected}">
  <option value="">Choose a Song</option>
  {#each levels as l}
    <option value="{l.title}">{l.title} by {l.artist}</option>
  {/each}
</select>
<div class="piano">
  {#each piano.reverse() as { midi, note, octave }}
    <button
      class="key"
      class:sharp="{note.includes('#')}"
      on:click="{() => play(note, octave)}">
      {note}{octave}
    </button>
  {/each}
</div>
