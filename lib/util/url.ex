defmodule Util.URL do
  # TODO this doesn't exactly replicate how Alexa treats certain sites like `foo.tumblr.com`. Our
  #      code will return `tumblr.com` whereas Alexa will understand the full `foo.tumblr.com`
  #
  #      We could just let Alexa parse all the URLs for us, but we'd get into a weird situation where
  #      somebody searches `en.wikipedia.org`, Alexa returns `wikipedia.org` results, we cache those
  #      under
  def parse(url) do
    url
    |> String.downcase()
    |> trim_protocol_and_path()
    |> remove_subdomains()
  end

  def clean(url) do
    url
    |> trim_protocol_and_path()
    |> String.replace(~r{^www.}, "")
  end

  defp remove_subdomains(host) do
    {:ok, %{domain: domain, tld: tld}} = Domainatrex.parse(host)
    "#{domain}.#{tld}"
  end

  # also trims trailing slash
  defp trim_protocol_and_path(url) do
    case URI.parse(url) do
      %{host: nil, path: path} ->
        URI.parse("http://#{path}").host

      %{host: host} ->
        host
    end
  end
end
