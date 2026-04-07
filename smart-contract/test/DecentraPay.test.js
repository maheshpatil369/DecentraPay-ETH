const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DecentraPay", () => {
  let contract, owner, alice, bob, carol;

  beforeEach(async () => {
    [owner, alice, bob, carol] = await ethers.getSigners();
    const F = await ethers.getContractFactory("DecentraPay");
    contract = await F.deploy();
    await contract.waitForDeployment();
  });

  describe("sendPayment", () => {
    it("transfers ETH and emits PaymentSent", async () => {
      const amt = ethers.parseEther("1.0");
      await expect(
        contract.connect(alice).sendPayment(bob.address, "hello", { value: amt })
      ).to.emit(contract, "PaymentSent")
        .withArgs(alice.address, bob.address, amt, "hello", (ts) => ts > 0n);

      const [sent,,count] = await contract.walletStats(alice.address);
      expect(sent).to.equal(amt);
      expect(count).to.equal(1n);
    });

    it("updates totalSent, totalReceived, txCount", async () => {
      const amt = ethers.parseEther("2.0");
      await contract.connect(alice).sendPayment(bob.address, "", { value: amt });
      const [,bobRec] = await contract.walletStats(bob.address);
      expect(bobRec).to.equal(amt);
    });

    it("reverts on zero value", async () => {
      await expect(
        contract.connect(alice).sendPayment(bob.address, "", { value: 0 })
      ).to.be.revertedWithCustomError(contract, "ZeroValue");
    });

    it("reverts on zero address", async () => {
      await expect(
        contract.connect(alice).sendPayment(ethers.ZeroAddress, "", { value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(contract, "ZeroAddress");
    });

    it("reverts on message > 256 bytes", async () => {
      const longMsg = "A".repeat(257);
      await expect(
        contract.connect(alice).sendPayment(bob.address, longMsg, { value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(contract, "MessageTooLong");
    });
  });

  describe("splitPayment", () => {
    it("splits ETH and emits SplitPayment", async () => {
      const amounts = [ethers.parseEther("1"), ethers.parseEther("2")];
      const total   = amounts.reduce((a, b) => a + b, 0n);
      await expect(
        contract.connect(alice).splitPayment([bob.address, carol.address], amounts, "dinner", { value: total })
      ).to.emit(contract, "SplitPayment");

      const [,bobRec]   = await contract.walletStats(bob.address);
      const [,carolRec] = await contract.walletStats(carol.address);
      expect(bobRec).to.equal(amounts[0]);
      expect(carolRec).to.equal(amounts[1]);
    });

    it("reverts on value mismatch", async () => {
      await expect(
        contract.connect(alice).splitPayment([bob.address], [ethers.parseEther("2")], "",
          { value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(contract, "ValueMismatch");
    });

    it("reverts on empty recipients", async () => {
      await expect(
        contract.connect(alice).splitPayment([], [], "", { value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(contract, "EmptyRecipients");
    });

    it("reverts on array length mismatch", async () => {
      await expect(
        contract.connect(alice).splitPayment(
          [bob.address, carol.address],
          [ethers.parseEther("1")],
          "", { value: ethers.parseEther("1") }
        )
      ).to.be.revertedWithCustomError(contract, "ArrayLengthMismatch");
    });
  });

  describe("walletStats", () => {
    it("returns zero for new wallet", async () => {
      const [s, r, c] = await contract.walletStats(alice.address);
      expect(s).to.equal(0n);
      expect(r).to.equal(0n);
      expect(c).to.equal(0n);
    });
  });
});
