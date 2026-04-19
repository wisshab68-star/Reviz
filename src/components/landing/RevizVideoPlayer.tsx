"use client";

import { Player } from "@remotion/player";
import { RevizDemo } from "./RevizComposition";

export function RevizVideoPlayer() {
  return (
    <Player
      component={RevizDemo}
      durationInFrames={37 * 30}
      compositionWidth={1080}
      compositionHeight={1920}
      fps={30}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "inherit",
      }}
      autoPlay
      loop
      controls={false}
      showVolumeControls={false}
      clickToPlay={false}
    />
  );
}
