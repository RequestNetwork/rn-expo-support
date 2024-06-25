import "@/index";
import { Image, StyleSheet, Platform, Button } from "react-native";
import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  RequestNetwork,
  Types,
  Utils,
} from "@requestnetwork/request-client.js";
import { EthereumPrivateKeySignatureProvider } from "@requestnetwork/epk-signature";
import { CurrencyTypes } from "@requestnetwork/types";
import { useState } from "react";

export default function HomeScreen() {
  const privateKey = process.env.EXPO_PUBLIC_PRIVATE_KEY;

  const [isLoading, setIsLoading] = useState(false);

  const createRequest = async () => {
    setIsLoading(true);

    const epkSignatureProviders = new EthereumPrivateKeySignatureProvider({
      method: Types.Signature.METHOD.ECDSA,
      privateKey: privateKey as string,
    });

    console.log("Signature is done");

    const payeeIdentity = "0xb07D2398d2004378cad234DA0EF14f1c94A530e4";
    const payerIdentity = "0xe968dfcD119d7Fdac441F61e92ECB47E34530892";
    const feeRecipient = "0x0000000000000000000000000000000000000000";

    console.log("Create random variables");

    const requestCreateParameters = {
      requestInfo: {
        // The currency in which the request is denominated
        currency: {
          type: Types.RequestLogic.CURRENCY.ERC20,
          network: "sepolia" as CurrencyTypes.EvmChainName,
          value: "0x370DE27fdb7D1Ff1e1BaA7D11c5820a324Cf623C",
        },

        // The expected amount as a string, in parsed units, respecting `decimals`
        // Consider using `parseUnits()` from ethers or viem
        expectedAmount: "10000000000000000",

        // The payee identity. Not necessarily the same as the payment recipient.
        payee: {
          type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
          value: payeeIdentity,
        },

        // The payer identity. If omitted, any identity can pay the request.
        payer: {
          type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
          value: payerIdentity,
        },

        // The request creation timestamp.
        timestamp: Utils.getCurrentTimestampInSecond(),
      },

      // The paymentNetwork is the method of payment and related details.
      paymentNetwork: {
        id: Types.Extension.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
        parameters: {
          paymentNetworkName: "sepolia",
          paymentAddress: payeeIdentity,
          feeAddress: feeRecipient,
          feeAmount: "0",
        },
      },

      // The contentData can contain anything.
      // Consider using rnf_invoice format from @requestnetwork/data-format
      contentData: {
        meta: {
          format: "rnf_invoice",
          version: "0.0.3",
        },
        creationDate: new Date().toISOString(),
        invoiceNumber: "200",
        invoiceItems: [
          {
            currency: "USD",
            name: "React Native Request",
            quantity: 2,
            unitPrice: "500",
            tax: {
              type: "percentage",
              amount: "0",
            },
          },
        ],
      },

      // The identity that signs the request, either payee or payer identity.
      signer: {
        type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
        value: payeeIdentity,
      },
    };

    console.log("Create request object");

    const requestNetwork = new RequestNetwork({
      nodeConnectionConfig: {
        baseURL: "https://gnosis.gateway.request.network",
      },
      signatureProvider: epkSignatureProviders,
    });

    console.log("Create request network");

    try {
      const result = await requestNetwork.createRequest(
        requestCreateParameters
      );

      console.log("Done creating request");

      console.log(result);
    } catch (err) {
      console.error(err);
    }

    setIsLoading(false);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <Button
        title={isLoading ? "Loading..." : "Create Request"}
        disabled={isLoading}
        onPress={async () => {
          try {
            console.log("Starting to create a request");
            await createRequest();
          } catch (err) {
            console.log(err);
          }
        }}
      />
      <Button
        title="Random Values"
        onPress={() => {
          try {
            const values = crypto.randomBytes(16);
            console.log("Random bytes are : ", values);
          } catch (err) {
            console.error(err);
          }
        }}
      />
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit{" "}
          <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText>{" "}
          to see changes. Press{" "}
          <ThemedText type="defaultSemiBold">
            {Platform.select({ ios: "cmd + d", android: "cmd + m" })}
          </ThemedText>{" "}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 2: Explore</ThemedText>
        <ThemedText>
          Tap the Explore tab to learn more about what's included in this
          starter app.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          When you're ready, run{" "}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText>{" "}
          to get a fresh <ThemedText type="defaultSemiBold">app</ThemedText>{" "}
          directory. This will move the current{" "}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{" "}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
