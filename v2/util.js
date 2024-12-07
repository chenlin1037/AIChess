export default class Timer {
  constructor(element) {
    this.element = element;
    this.startTime = null;
    this.elapsedTime = 0;
    this.timerInterval = null;
  }

  start() {
    if (!this.startTime) {
      this.startTime = Date.now() - this.elapsedTime;
      this.timerInterval = setInterval(() => {
        try {
          this.updateDisplay();
        } catch (error) {
          console.error("Error updating display:", error);
        }
      }, 1000);
    }
  }

  stop() {
    if (this.startTime) {
      console.log("Timer stopped");
      clearInterval(this.timerInterval);
      this.elapsedTime = Date.now() - this.startTime;
      this.startTime = null;
    }
  }

  reset() {
    console.log("Timer reset");
    this.stop();
    this.elapsedTime = 0;
    this.updateDisplay();
  }

  updateDisplay() {
    const currentTime = this.startTime
      ? Date.now() - this.startTime
      : this.elapsedTime;
    const seconds = Math.floor(currentTime / 1000) % 60;
    const minutes = Math.floor(currentTime / 60000);
    const display = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    this.element.innerHTML = "时长：" + display;
  }

  getFinalTime() {
    const totalSeconds = Math.floor(this.elapsedTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}分${seconds}秒`;
  }
}
