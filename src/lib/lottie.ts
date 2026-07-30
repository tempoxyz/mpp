type LottiePlayer =
  typeof import("lottie-web/build/player/lottie_light")["default"];
export type LottieAnimation = ReturnType<LottiePlayer["loadAnimation"]>;

let player: Promise<LottiePlayer> | undefined;

export function loadLottiePlayer() {
  player ??= import("lottie-web/build/player/lottie_light").then(
    (module) => module.default,
  );
  return player;
}
