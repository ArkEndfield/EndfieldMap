export class ProgressInterpolator {
  private currentValue: number = 0;
  private targetValue: number = 0;
  private velocity: number = 0;

  // 弹簧物理参数
  private readonly STIFFNESS = 100; // 刚度
  private readonly DAMPING = 20; // 阻尼
  private readonly MASS = 1; // 质量

  update(target: number, deltaTime: number): number {
    this.targetValue = target;

    // 弹簧物理模拟
    const displacement = this.targetValue - this.currentValue;
    const springForce = this.STIFFNESS * displacement;
    const dampingForce = -this.DAMPING * this.velocity;
    const acceleration = (springForce + dampingForce) / this.MASS;

    this.velocity += acceleration * deltaTime;
    this.currentValue += this.velocity * deltaTime;

    // 强制钳制在 [0, 100] 范围内，物理模拟可能会产生过冲
    if (this.currentValue > 100) {
      this.currentValue = 100;
      this.velocity = 0; // 碰到边界速度归零
    } else if (this.currentValue < 0) {
      this.currentValue = 0;
      this.velocity = 0;
    }

    // 防止微小震荡
    if (Math.abs(displacement) < 0.01 && Math.abs(this.velocity) < 0.01) {
      this.currentValue = this.targetValue;
      this.velocity = 0;
    }

    return this.currentValue;
  }
}
