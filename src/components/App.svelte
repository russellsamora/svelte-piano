<style>
  .piano {
    margin-top: 2rem;
  }
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
  import samples from "../data/samples.json";

  pianoData.reverse();

  let Tone;
  let synth;
  let sampler;

  let selected;
  let part;

  const lowC = 36;
  const highC = 84;
  let piano = pianoData.filter(d => +d.midi >= lowC && +d.midi <= highC);

  onMount(async () => {
    const module = await import("tone");
    if (!Tone) {
      Tone = module.default;
      sampler = new Tone.Sampler(samples, {
        release: 0.5,
        baseUrl: "assets/notes/"
      }).toMaster();
      part = new Tone.Part(() => {}, []);
    }
  });

  $: level = levels.find(d => d.title === selected);
  $: if (part && level) {
    Tone.Transport.stop();
    part.removeAll();
    const values = midiToNotation(level.sequence);
    part = new Tone.Part((time, value) => {
      sampler.triggerAttackRelease(value.note, value.duration, time);
    }, values).start(0);

    Tone.Transport.bpm.value = level.tempo;
    Tone.Transport.timeSignature = level.sig || 4;
    Tone.Transport.start();
  }

  function play(note, octave) {
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
  {#each piano as { midi, note, octave } (midi)}
    <button
      class="key"
      class:sharp="{note.includes('#')}"
      on:click="{() => play(note, octave)}">
      {note}{octave}
    </button>
  {/each}
</div>
