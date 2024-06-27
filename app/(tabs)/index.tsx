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
import { providers, Wallet } from "ethers";

import {
  approveErc20,
  hasErc20Approval,
  payRequest,
} from "@requestnetwork/payment-processor";

export default function HomeScreen() {
  const privateKey = process.env.EXPO_PUBLIC_PRIVATE_KEY;
  const payerPrivateKey = process.env.EXPO_PUBLIC_PRIVATE_KEY2;

  const [isLoading, setIsLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [request, setRequest] = useState(null);
  const payeeIdentity = "0xb07D2398d2004378cad234DA0EF14f1c94A530e4";
  const payerIdentity = "0xe968dfcD119d7Fdac441F61e92ECB47E34530892";
  const feeRecipient = "0x0000000000000000000000000000000000000000";
  const createRequest = async () => {
    setIsLoading(true);

    const epkSignatureProviders = new EthereumPrivateKeySignatureProvider({
      method: Types.Signature.METHOD.ECDSA,
      privateKey: privateKey as string,
    });

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
        expectedAmount: "10000000000000000000",

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
        invoiceNumber: "Created from React Native",
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

    const requestNetwork = new RequestNetwork({
      nodeConnectionConfig: {
        baseURL: "https://gnosis.gateway.request.network",
      },
      signatureProvider: epkSignatureProviders,
    });

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request creation timed out")), 30000)
    );
    const result = await Promise.race([
      requestNetwork.createRequest(requestCreateParameters),
      timeout,
    ]);

    setRequest(result.requestId);

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
            await createRequest();
          } catch (err) {
            console.error(err);
          }
        }}
      />
      <Button
        title={isPaying ? "Loading..." : "Pay request"}
        onPress={async () => {
          try {
            setIsPaying(true);

            const requestClient = new RequestNetwork({
              nodeConnectionConfig: {
                baseURL: "https://gnosis.gateway.request.network",
              },
            });

            const requestFromStuff = await requestClient.fromRequestId(request);
            const requestData = requestFromStuff.getData();

            const provider = new providers.JsonRpcProvider(
              "https://eth-sepolia.g.alchemy.com/v2/PlBKMQhwRSMMnV4ue8_Xdd_ibFsa8EbB"
            );
            const signer = new Wallet(payerPrivateKey, provider);
            const address = await signer.getAddress();
            const _hasErc20Approval = await hasErc20Approval(
              requestData,
              address,
              provider
            );
            if (!_hasErc20Approval) {
              const approvalTx = await approveErc20(requestData, signer);
              await approvalTx.wait(2);
            }
            const paymentTx = await payRequest(requestData, signer);
            await paymentTx.wait(2);

            setIsPaying(false);
          } catch (err) {
            console.error(err);
          }
        }}
      />
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">
          {request && JSON.stringify(request)}
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
