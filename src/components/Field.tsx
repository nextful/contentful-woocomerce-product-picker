import React, { useState, useEffect } from "react";
import { PlainClientAPI } from "contentful-management";
import {
  Select,
  Option,
  Button,
  Flex,
  TextInput,
  IconButton,
  Paragraph
} from "@contentful/forma-36-react-components";
import { FieldExtensionSDK } from "@contentful/app-sdk";
import { AppInstallationParameters } from "./ConfigScreen";
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

interface FieldProps {
  sdk: FieldExtensionSDK;
  cma: PlainClientAPI;
}

type Product = {
  id: string;
  name: string;
};

const Field = (props: FieldProps) => {
  const sdk = props.sdk;
  const field = sdk.field;
  const { apiUrl, apiKey, apiSecret } = sdk.parameters
    .installation as AppInstallationParameters;

  const [products, setProducts] = useState<Product[]>([]);
  const [canLoadMore, setCanLoadMore] = useState(true);
  const [activeProduct, setActiveProduct] = useState<Product|undefined>();
  const [search, setSearch] = useState('');

  const PER_PAGE = 10;

  const client = new WooCommerceRestApi({
    url: apiUrl,
    consumerKey: apiKey,
    consumerSecret: apiSecret,
    version: "wc/v3",
  });

  const getProductById = async (id: string) => {
    const response = await client.get(`products/${id}`);
    return response.data;
}

  useEffect(() => {
    (async () => {
      const fieldValue = field.getValue();

      if (fieldValue) {
        const product = await getProductById(fieldValue);
        setActiveProduct({
          id: product.id,
          name: product.name,
        })
      }

      const response = await client.get("products", {
        per_page: PER_PAGE,
      });

      if (response.data.length < PER_PAGE) {
        setCanLoadMore(false);
      }

      const productData = response.data.map((product: any) => ({
        name: product.name,
        id: product.id,
      }));
      setProducts(productData);
    })();
  }, []);

  const loadMore = async () => {
    const response = await client.get("products", {
      per_page: PER_PAGE,
      skip: products.length,
      search,
    });

    const productData = response.data.map((product: any) => ({
      name: product.name,
      id: product.id,
    }));
    setProducts([...products, ...productData]);

    if (response.data.length < PER_PAGE) {
      setCanLoadMore(false);
      return;
    } 

    setCanLoadMore(true);
  };

  const searchProducts = async () => {
    const response = await client.get("products", {
      per_page: PER_PAGE,
      search,
    });

    const productData = response.data.map((product: any) => ({
      name: product.name,
      id: product.id,
    }));

    setProducts(productData);

    if (response.data.length < PER_PAGE) {
      setCanLoadMore(false);
      return;
    } 

    setCanLoadMore(true);
  };

  const getActiveProduct = () => {
    if (activeProduct?.name) {
      return activeProduct.name;
    }

    const fieldValue = field.getValue();

    if (fieldValue) {
      return fieldValue;
    }

    return 'none';
  }

  const onSelect = async (id: string) => {
    field.setValue(id);
    const product = await getProductById(id);
    setActiveProduct({
      id: product.id,
      name: product.name
    });
  };

  return (
    <>
      <Paragraph>Current selection: {getActiveProduct()}</Paragraph>
      <Flex marginTop="spacingL" margin="spacingXs">
        <TextInput name="search" id="search" value="" placeholder="Search" onChange={(e) => setSearch(e.target.value)} />

        <IconButton
          buttonType="secondary"
          label="Search"
          iconProps={{ icon: 'Search', size: 'large' }}
          onClick={searchProducts}
        />
      </Flex>
      <Flex marginTop="spacingXs" margin="spacingXs">
        <Select id="optionSelect" name="optionSelect" width="large" onChange={(e) => onSelect(e.target.value)}>
          <Option value="">Choose product</Option>
          {products.map((product: any) => {
            return <Option key={product.id} value={product.id}>{product.name}</Option>;
          })}
        </Select>

        {canLoadMore && (
          <Button style={{ marginLeft: "20px" }} onClick={loadMore}>
            Load more
          </Button>
        )}
      </Flex>
    </>
  );
};

export default Field;
