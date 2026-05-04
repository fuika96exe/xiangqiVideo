import "./index.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import timeline from "./video-timeline.json";

// Calculate the total duration
const totalDuration = timeline.reduce((acc, scene) => acc + scene.durationInFrames, 0);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyComp"
        component={MyComposition}
        durationInFrames={totalDuration > 0 ? totalDuration : 60}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};
